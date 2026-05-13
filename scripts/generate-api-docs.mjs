import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();
const generatedAt = new Date().toISOString();

const components = [
  {
    key: 'api-gateway',
    name: 'API Gateway',
    root: 'workspaces/api-gateway',
    role: 'Public proxy for Auth, Notifications, public substacks, and Q&A topic/comment routes.',
    routeKind: 'hono',
    routeEntry: 'src/adapters/restful/hono/endpoints/index.ts',
  },
  {
    key: 'auth',
    name: 'Auth Service',
    root: 'workspaces/auth',
    role: 'Identity, JWT/refresh lifecycle, user follows, substacks, repositories, seeds, and notification integration.',
    routeKind: 'hono',
    routeEntry: 'src/adapters/restful/hono/endpoints/index.ts',
  },
  {
    key: 'dashboard',
    name: 'Dashboard',
    root: 'workspaces/dashboard',
    role: 'TanStack Start UI plus server proxy routes for auth, substacks, topics, notifications, jobs, and recommendations.',
    routeKind: 'tanstack',
  },
  {
    key: 'job-service',
    name: 'Job Service',
    root: 'workspaces/job-service',
    role: 'Fastify app, job/application routes, MongoDB access, JWT validation, Redis outbox publisher.',
    routeKind: 'fastify',
  },
  {
    key: 'notifications',
    name: 'Notifications Service',
    root: 'workspaces/notifications',
    role: 'Portal/internal notification routes, notification commands/queries, Mongo repository, system notification mapping.',
    routeKind: 'hono',
    routeEntry: 'src/adapters/restful/hono/endpoints/index.ts',
  },
  {
    key: 'qna',
    name: 'Q&A Service',
    root: 'workspaces/qna',
    role: 'Nest controllers/services/DTOs/schemas for topics, comments, voting, subscriptions, MongoDB, and Elasticsearch search.',
    routeKind: 'nest',
  },
  {
    key: 'recsys',
    name: 'Recommendation Service',
    root: 'workspaces/recsys',
    role: 'Fastify recommendation routes, Redis stream ingestion, Neo4j graph logic, ranking/scoring, BullMQ jobs, metrics.',
    routeKind: 'fastify',
  },
  {
    key: 'domain-auth',
    name: 'Shared Domain - Auth',
    root: 'packages/@domain/auth',
    role: 'Auth/substack/user schemas, entities, repository contracts, and domain errors.',
    routeKind: 'none',
  },
  {
    key: 'domain-notification',
    name: 'Shared Domain - Notification',
    root: 'packages/@domain/notification',
    role: 'Notification schema, entity, and repository contract.',
    routeKind: 'none',
  },
  {
    key: 'node-hono',
    name: 'Shared Node - Hono',
    root: 'packages/@node/hono',
    role: 'Reusable Hono middleware for IoC, Drizzle, Mongoose, internal auth, and logging.',
    routeKind: 'none',
  },
  {
    key: 'node-utils',
    name: 'Shared Node - Utils',
    root: 'packages/@node/utils',
    role: 'Shared utilities.',
    routeKind: 'none',
  },
];

const httpMethods = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
]);

function main() {
  const reports = components.map((component) => {
    const rootAbs = path.join(repoRoot, component.root);
    const files = listSourceFiles(rootAbs);
    const routes = extractRoutes(component, files);
    const apis = extractExportedApis(component, files);

    return {
      ...component,
      files,
      routes: sortRoutes(routes),
      apis: apis.sort((a, b) => a.name.localeCompare(b.name)),
    };
  });

  writeApiInventory(reports);
  writeApiReport(reports);

  console.log(
    `Generated API docs: ${sum(reports, 'routes')} routes, ${sum(
      reports,
      'apis',
    )} exported APIs`,
  );
}

function listSourceFiles(rootAbs) {
  if (!fs.existsSync(rootAbs)) return [];

  const results = [];
  const ignoreSegments = new Set([
    '.git',
    '.tanstack',
    'coverage',
    'dist',
    'lib',
    'node_modules',
  ]);

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignoreSegments.has(entry.name)) continue;

      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      if (/(\.d\.ts|\.test\.ts|\.test\.tsx|\.spec\.ts|\.spec\.tsx)$/.test(entry.name)) {
        continue;
      }
      if (entry.name === 'routeTree.gen.ts') continue;

      results.push(full);
    }
  }

  walk(rootAbs);
  return results.sort();
}

function extractRoutes(component, files) {
  if (component.routeKind === 'hono') {
    return extractHonoRoutes(component);
  }

  if (component.routeKind === 'fastify') {
    return files.flatMap((file) => extractFastifyRoutes(component, file));
  }

  if (component.routeKind === 'nest') {
    return files.flatMap((file) => extractNestRoutes(component, file));
  }

  if (component.routeKind === 'tanstack') {
    return files.flatMap((file) => extractTanstackServerRoutes(component, file));
  }

  return [];
}

function extractHonoRoutes(component) {
  const entryAbs = path.join(repoRoot, component.root, component.routeEntry);
  if (!fs.existsSync(entryAbs)) return [];

  const importMap = getImportMap(entryAbs, path.join(repoRoot, component.root));
  const mounts = [];
  const entrySource = createSourceFile(entryAbs);

  visit(entrySource, (node) => {
    if (!ts.isCallExpression(node)) return;
    const prop = getPropertyName(node.expression);
    if (prop !== 'route') return;

    const [prefixArg, symbolArg] = node.arguments;
    if (!isStringLike(prefixArg) || !ts.isIdentifier(symbolArg)) return;

    const targetFile = importMap.get(symbolArg.text);
    if (!targetFile) return;

    mounts.push({
      prefix: prefixArg.text,
      targetFile,
    });
  });

  return mounts.flatMap((mount) => {
    return extractHonoHandlers(component, mount.targetFile).map((route) => ({
      ...route,
      path: joinUrlPath(mount.prefix, route.path),
    }));
  });
}

function extractHonoHandlers(component, file) {
  const source = createSourceFile(file);
  const routes = [];

  visit(source, (node) => {
    if (!ts.isCallExpression(node)) return;
    const method = getPropertyName(node.expression);
    if (!method || !httpMethods.has(method)) return;

    const [routeArg] = node.arguments;
    if (!isStringLike(routeArg)) return;
    if (!routeArg.text.startsWith('/')) return;

    routes.push(createRoute(component, method, routeArg.text, file, node));
  });

  return routes;
}

function extractFastifyRoutes(component, file) {
  const source = createSourceFile(file);
  const routes = [];

  visit(source, (node) => {
    if (!ts.isCallExpression(node)) return;
    const method = getPropertyName(node.expression);
    if (!method || !httpMethods.has(method)) return;

    const [routeArg] = node.arguments;
    if (!isStringLike(routeArg)) return;
    if (!routeArg.text.startsWith('/')) return;

    routes.push(createRoute(component, method, routeArg.text, file, node));
  });

  return routes;
}

function extractNestRoutes(component, file) {
  const source = createSourceFile(file);
  const routes = [];

  visit(source, (node) => {
    if (!ts.isClassDeclaration(node)) return;
    const controller = getDecoratorCall(node, 'Controller');
    if (!controller) return;

    const prefix = getDecoratorPath(controller);

    for (const member of node.members) {
      if (!ts.isMethodDeclaration(member)) continue;

      for (const methodName of ['Get', 'Post', 'Put', 'Patch', 'Delete']) {
        const decorator = getDecoratorCall(member, methodName);
        if (!decorator) continue;

        routes.push(
          createRoute(
            component,
            methodName.toLowerCase(),
            joinUrlPath(prefix, getDecoratorPath(decorator)),
            file,
            member,
          ),
        );
      }
    }
  });

  return routes;
}

function extractTanstackServerRoutes(component, file) {
  if (!file.includes(`${path.sep}src${path.sep}routes${path.sep}`)) return [];

  const text = fs.readFileSync(file, 'utf8');
  const source = createSourceFile(file);
  const routePath = findCreateFileRoutePath(source);
  if (!routePath || !text.includes('handlers')) return [];

  const methods = new Set();
  const handlerBlockMatch = text.match(/handlers\s*:\s*\{[\s\S]*?\n\s*\}\s*,?\s*\n\s*\}/m);
  const scanText = handlerBlockMatch?.[0] ?? text;

  for (const match of scanText.matchAll(/\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*:/g)) {
    methods.add(match[1].toLowerCase());
  }

  return [...methods].map((method) =>
    createRoute(component, method, routePath, file, source),
  );
}

function findCreateFileRoutePath(source) {
  let routePath = '';

  visit(source, (node) => {
    if (routePath || !ts.isCallExpression(node)) return;
    const expr = node.expression;

    if (!ts.isIdentifier(expr) || expr.text !== 'createFileRoute') return;

    const [routeArg] = node.arguments;
    if (isStringLike(routeArg)) {
      routePath = routeArg.text;
    }
  });

  return routePath;
}

function extractExportedApis(component, files) {
  const apis = [];

  for (const file of files) {
    const source = createSourceFile(file);

    visit(source, (node) => {
      if (ts.isFunctionDeclaration(node) && isExported(node) && node.name) {
        apis.push(createApi(component, node.name.text, 'function', file, node));
      }

      if (ts.isClassDeclaration(node) && isExported(node) && node.name) {
        const className = node.name.text;
        apis.push(createApi(component, className, 'class', file, node));

        for (const member of node.members) {
          if (!ts.isMethodDeclaration(member)) continue;
          if (hasModifier(member, ts.SyntaxKind.PrivateKeyword)) continue;

          const methodName = getMemberName(member.name);
          if (!methodName) continue;

          apis.push(
            createApi(
              component,
              `${className}.${methodName}`,
              'method',
              file,
              member,
            ),
          );
        }
      }

      if (ts.isVariableStatement(node) && isExported(node)) {
        for (const declaration of node.declarationList.declarations) {
          const name = getMemberName(declaration.name);
          if (!name) continue;

          apis.push(createApi(component, name, 'variable', file, node));
        }
      }
    });
  }

  return dedupeBy(apis, (api) => `${api.name}:${api.file}:${api.line}`);
}

function getImportMap(file, componentRootAbs) {
  const source = createSourceFile(file);
  const importMap = new Map();

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!isStringLike(statement.moduleSpecifier)) continue;

    const resolved = resolveImport(
      file,
      statement.moduleSpecifier.text,
      componentRootAbs,
    );
    if (!resolved) continue;

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;

    for (const element of namedBindings.elements) {
      importMap.set(element.name.text, resolved);
    }
  }

  return importMap;
}

function resolveImport(fromFile, specifier, componentRootAbs) {
  let base;

  if (specifier.startsWith('#/')) {
    base = path.join(componentRootAbs, 'src', specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }

  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function createSourceFile(file) {
  return ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, (child) => visit(child, callback));
}

function createRoute(component, method, routePath, file, node) {
  return {
    component: component.name,
    method: method.toUpperCase(),
    path: normalizeUrlPath(routePath),
    file: relativePath(file),
    line: lineOf(file, node),
  };
}

function createApi(component, name, kind, file, node) {
  return {
    component: component.name,
    name,
    kind,
    file: relativePath(file),
    line: lineOf(file, node),
  };
}

function lineOf(file, node) {
  const source = createSourceFile(file);
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

function getPropertyName(expression) {
  if (!ts.isPropertyAccessExpression(expression)) return '';
  return expression.name.text;
}

function isStringLike(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function getDecoratorCall(node, name) {
  const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : [];

  for (const decorator of decorators) {
    const expression = decorator.expression;

    if (ts.isCallExpression(expression)) {
      const callName = getCallName(expression.expression);
      if (callName === name) return expression;
    } else if (getCallName(expression) === name) {
      return {
        arguments: [],
      };
    }
  }

  return null;
}

function getDecoratorPath(call) {
  const [arg] = call.arguments;
  if (!arg) return '/';
  if (isStringLike(arg)) return arg.text;
  return '/';
}

function getCallName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return '';
}

function isExported(node) {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function hasModifier(node, kind) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === kind));
}

function getMemberName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return '';
}

function joinUrlPath(prefix, child) {
  const left = normalizeUrlPath(prefix);
  const right = normalizeUrlPath(child);

  if (left === '/') return right;
  if (right === '/') return left;

  return `${left}${right}`.replace(/\/{2,}/g, '/');
}

function normalizeUrlPath(value) {
  const normalized = `/${String(value ?? '').replace(/^\/+/, '')}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
}

function relativePath(file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, '/');
}

function sortRoutes(routes) {
  return dedupeBy(routes, (route) => `${route.method} ${route.path}`).sort(
    (a, b) => `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`),
  );
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function sum(reports, key) {
  return reports.reduce((total, report) => total + report[key].length, 0);
}

function writeApiInventory(reports) {
  const lines = [
    '# API Inventory',
    '',
    `Generated: ${generatedAt}`,
    '',
    'Tooling: `pnpm docs:api` runs `scripts/generate-api-docs.mjs`, a static TypeScript source extractor. Scope is TypeScript source under `workspaces/` and `packages/`, excluding tests, generated route trees, build output, and declaration files.',
    '',
    'Limitations: this is static analysis. It lists declared REST/server handlers and exported callable/class APIs, but it does not prove runtime registration, middleware reachability, generated OpenAPI schemas, or dynamically built route paths.',
    '',
    '## Summary',
    '',
    '| Component | Source files scanned | REST handlers | Exported function/class APIs |',
    '| --- | ---: | ---: | ---: |',
    ...reports.map(
      (report) =>
        `| ${report.name} | ${report.files.length} | ${report.routes.length} | ${report.apis.length} |`,
    ),
    '',
    '## REST And Server Route API',
    '',
  ];

  for (const report of reports) {
    lines.push(`### ${report.name}`, '');

    if (!report.routes.length) {
      lines.push('- No REST/server routes detected.', '');
      continue;
    }

    for (const route of report.routes) {
      lines.push(
        `- \`${route.method}\` \`${route.path}\` - [${route.file}:${route.line}](${route.file}:${route.line})`,
      );
    }

    lines.push('');
  }

  lines.push('## Exported Function/Class API', '');

  for (const report of reports) {
    lines.push(`### ${report.name}`, '');

    if (!report.apis.length) {
      lines.push('- No exported function/class APIs detected.', '');
      continue;
    }

    for (const api of report.apis) {
      lines.push(
        `- \`${api.name}\` (${api.kind}) - [${api.file}:${api.line}](${api.file}:${api.line})`,
      );
    }

    lines.push('');
  }

  writeMarkdown('API_INVENTORY.md', lines);
}

function writeApiReport(reports) {
  const totalRoutes = sum(reports, 'routes');
  const totalApis = sum(reports, 'apis');
  const sharedApis = reports
    .filter((report) => report.root.startsWith('packages/'))
    .reduce((total, report) => total + report.apis.length, 0);

  const lines = [
    '# API Report',
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Tool Run',
    '',
    '- `pnpm docs:api` regenerated this report from static TypeScript source analysis.',
    '- The extractor is committed at `scripts/generate-api-docs.mjs` and does not require temp-only tooling.',
    '- `API_INVENTORY.md` contains the full route and exported API list.',
    '',
    '## Report Scope',
    '',
    '- Included: TypeScript source under `workspaces/` and `packages/`.',
    '- Excluded: tests, generated route trees, declaration files, build output, and node_modules.',
    '- Static analysis limitation: this report describes declared API surfaces; it does not prove runtime reachability, middleware behavior, or runtime-generated schemas.',
    '',
    '## API Surface Summary',
    '',
    '| Component | Files scanned | REST/server routes | Exported function/class APIs | Main role |',
    '| --- | ---: | ---: | ---: | --- |',
    ...reports.map(
      (report) =>
        `| ${report.name} | ${report.files.length} | ${report.routes.length} | ${report.apis.length} | ${report.role} |`,
    ),
    '',
    '## REST Route Groups',
    '',
  ];

  for (const report of reports) {
    if (!report.routes.length) continue;

    lines.push(`### ${report.name}`, '');
    for (const route of report.routes) {
      lines.push(`- \`${route.method} ${route.path}\``);
    }
    lines.push('');
  }

  lines.push('## Function/Class API Families', '');

  for (const report of reports) {
    lines.push(`### ${report.name}`, '', report.role, '');

    if (!report.apis.length) {
      lines.push('No exported function/class APIs detected.', '');
      continue;
    }

    lines.push('Representative callable/class APIs from the generated inventory:');
    for (const api of report.apis.slice(0, 12)) {
      lines.push(`- \`${api.name}\``);
    }

    if (report.apis.length > 12) {
      lines.push(
        `- Additional generated callable APIs: ${report.apis.length - 12}. See \`API_INVENTORY.md\` for the full list.`,
      );
    }

    lines.push('');
  }

  lines.push(
    '## Architecture-Relevant Conclusions From API Surface',
    '',
    `1. The current generated surface is ${totalRoutes} REST/server routes and ${totalApis} exported function/class APIs.`,
    '2. API Gateway fronts Auth, Notifications, public Substacks, and Q&A topic/comment routes.',
    '3. Dashboard now provides server proxy routes for Auth, Substacks, Q&A topics/comments, Notifications, Job Service, and Recommendation Service.',
    '4. Job Service and RecSys remain standalone upstream services; Dashboard proxies them directly rather than through API Gateway.',
    '5. Q&A owns topic/comment/vote data and still depends on Elasticsearch for search unless a fallback is implemented.',
    '6. Shared packages expose domain entities, schemas, repository contracts, and reusable Node/Hono helpers.',
    '',
    '## Source Artifacts',
    '',
    '- Full REST and exported callable list: `API_INVENTORY.md`.',
    '- Architecture summary: `ARCHITECTURE.md`.',
    `- Shared package exported APIs counted in summary: ${sharedApis}.`,
    '',
  );

  writeMarkdown('API_REPORT.md', lines);
}

function writeMarkdown(fileName, lines) {
  while (lines.at(-1) === '') {
    lines.pop();
  }

  fs.writeFileSync(path.join(repoRoot, fileName), `${lines.join('\n')}\n`);
}

main();

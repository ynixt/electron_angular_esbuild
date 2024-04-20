import { spawn } from 'child_process';
import chokidar from 'chokidar';
import debounce from 'debounce-fn';
import * as esbuild from 'esbuild';
import nodeModule from 'node:module';
import path from 'node:path';

const args = process.argv.slice(2);
const outfileMain = 'dist/main.js';
const outfilePreload = 'dist/preload.js';

const isWindows = process.platform === 'win32';
const electronBin = isWindows ? 'electron.cmd' : 'electron';
let ignoreExit = false;

const mainContext = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  target: ['node20.10'],
  sourcemap: true,
  external: ['electron', ...nodeModule.builtinModules],
  outfile: outfileMain,
});

const preloadContext = await esbuild.context({
  entryPoints: ['src/preload.ts'],
  bundle: true,
  platform: 'node',
  target: ['node20.10'],
  sourcemap: true,
  external: ['electron', ...nodeModule.builtinModules],
  outfile: outfilePreload,
});

if (args.includes('--watch')) {
  const sources = path.join(path.resolve(path.dirname('dist')), '**', '*.{js,ts,tsx}');
  const watcher = chokidar.watch([sources]);

  let electronProcess;

  watcher.on('ready', async () => {
    await mainContext.watch();
    await preloadContext.watch();

    const dispose = async () => {
      await watcher.close();
      await mainContext.dispose();
      await preloadContext.dispose();
    };

    watcher.on(
      'all',
      debounce(
        async () => {
          ignoreExit = true;
          await kill(electronProcess);
          ignoreExit = false;
          electronProcess = start(dispose);
        },
        { wait: 200 },
      ),
    );
  });

  process.on('exit', async () => {
    kill(electronProcess);
  });
} else {
  await mainContext.rebuild();
  await preloadContext.rebuild();
  await mainContext.dispose();
  await preloadContext.dispose();
}

function start(dispose) {
  const child = spawn(path.resolve(`./node_modules/.bin/${electronBin}`), ['.'], {
    stdio: 'inherit',
  });

  child.on('exit', async () => {
    if (!ignoreExit) {
      console.log('dispose by exit');
      await dispose();
    }
  });

  return child;
}

function kill(electronProcess) {
  if (electronProcess) {
    if (isWindows) {
      spawn('taskkill', ['/pid', `${electronProcess.pid}`, '/f', '/t']);
    } else {
      const pid = electronProcess.pid;
      const killed = electronProcess.killed;

      if (pid !== undefined && !killed) {
        process.kill(pid);
      }
    }

    const waitForExitCode = () => {
      return new Promise((resolve, reject) => {
        const timeout = 50;
        const limit = 10000;
        let timeWasted = 0;
        setTimeout(() => {
          if (electronProcess.exitCode == null) {
            if (timeWasted >= limit) {
              reject('timeout');
            } else {
              waitForExitCode().then(() => resolve());
            }
            timeWasted += timeout;
          } else {
            resolve();
          }
        }, timeout);
      });
    };

    return waitForExitCode();
  }
}

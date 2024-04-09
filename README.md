# Electron Angular ESBuild boilerplate

Easy configuration of Angular 17 + Electron + ESBuild

## Getting Started

### Clone this repository

``
git clone https://github.com/ynixt/electron_angular_esbuild
``

### Install the dependencies

``
npm i && cd renderer && npm i && cd ../main && npm i
``

## Project structure

### 'main' folder

Project responsible by the main process, that is, the electron itself.

### 'renderer' folder

Project responsible by the renderer process: Angular. Never try to use code from `main` here. All communications
between `main` and `renderer` should use [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc).

## Running

### Develop mode

Watching changes on Angular + Electron
``
npm run dev:watch
``

Watching changes only on Angular
``
npm run dev
``

### Building with electron builder

``
npm run electron:build
``

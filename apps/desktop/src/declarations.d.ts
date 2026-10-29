/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
declare module '*.css';

interface Window {
  experii: import('./shared/api').ExperiiApi;
}

import { promises as fs } from 'node:fs';

// id_token is kept only to send back as id_token_hint on the next sign-in to the same account.
export type Tokens = {
  access_token: string;
  refresh_token: string;
  id_token: string | null;
  expires_at: number;
  scopes: string[];
  email: string | null;
};

// Injected so tests run without Electron; main passes safeStorage's async API.
export type Vault = {
  isAvailable(): Promise<boolean>;
  encrypt(plain: string): Promise<Buffer>;
  decrypt(
    cipher: Buffer,
  ): Promise<{ result: string; shouldReEncrypt: boolean }>;
};

export class TokenStore {
  private memory: Tokens | null = null;

  constructor(
    private file: string,
    private vault: Vault,
  ) {}

  async load(): Promise<Tokens | null> {
    if (this.memory) return this.memory;
    if (!(await this.vault.isAvailable())) return null;
    let cipher: Buffer;
    try {
      cipher = await fs.readFile(this.file);
    } catch {
      return null;
    }
    try {
      const { result, shouldReEncrypt } = await this.vault.decrypt(cipher);
      this.memory = JSON.parse(result) as Tokens;
      if (shouldReEncrypt) await this.write(this.memory);
      return this.memory;
    } catch {
      return null;
    }
  }

  async save(tokens: Tokens): Promise<void> {
    this.memory = tokens;
    if (await this.vault.isAvailable()) await this.write(tokens);
  }

  async clear(): Promise<void> {
    this.memory = null;
    await fs.rm(this.file, { force: true });
  }

  private async write(tokens: Tokens) {
    const tmp = `${this.file}.tmp`;
    await fs.writeFile(tmp, await this.vault.encrypt(JSON.stringify(tokens)));
    await fs.rename(tmp, this.file);
  }
}

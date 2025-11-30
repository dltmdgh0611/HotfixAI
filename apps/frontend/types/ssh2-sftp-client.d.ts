declare module 'ssh2-sftp-client' {
  export default class SftpClient {
    constructor();
    connect(options: {
      host: string;
      port?: number;
      username?: string;
      password?: string;
      privateKey?: string | Buffer;
      passphrase?: string;
      readyTimeout?: number;
    }): Promise<void>;
    list(path: string): Promise<Array<{ name: string; type: string }>>;
    get(path: string): Promise<Buffer>;
    exists(path: string): Promise<false | 'd' | '-' | 'l'>;
    mkdir(path: string, recursive?: boolean): Promise<void>;
    put(input: Buffer | string | NodeJS.ReadableStream, remotePath: string): Promise<void>;
    end(): Promise<void>;
  }
}



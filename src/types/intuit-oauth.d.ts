declare module 'intuit-oauth' {
  export default class OAuthClient {
    constructor(options: {
      clientId: string;
      clientSecret: string;
      environment: string;
      redirectUri: string;
    });

    static scopes: {
      Accounting: string;
      Payment: string;
      Payroll: string;
      TimeTracking: string;
      Benefits: string;
      Profile: string;
      Email: string;
      Address: string;
      Phone: string;
      OpenId: string;
    };

    static environment: {
      sandbox: string;
      production: string;
    };

    authorizeUri(options: {
      scope: string[];
      state: string;
    }): string;

    createToken(uri: string): Promise<{
      getJson: () => any;
    }>;

    isAccessTokenValid(): boolean;

    makeApiCall(options: {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: string;
    }): Promise<{
      getJson: () => any;
    }>;
  }
} 
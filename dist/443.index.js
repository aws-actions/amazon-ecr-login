export const id = 443;
export const ids = [443];
export const modules = {

/***/ 9443:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var __webpack_unused_export__;


var client$1 = __webpack_require__(5152);
var core = __webpack_require__(402);
var client = __webpack_require__(2658);
var config = __webpack_require__(7291);
var endpoints = __webpack_require__(2085);
var protocols = __webpack_require__(3422);
var retry = __webpack_require__(3609);
var schema = __webpack_require__(6890);
var httpAuthSchemes = __webpack_require__(7523);
var serde = __webpack_require__(2430);
var nodeHttpHandler = __webpack_require__(2764);
var protocols$1 = __webpack_require__(7288);

const defaultSSOOIDCHttpAuthSchemeParametersProvider = async (config, context, input) => {
    return {
        operation: client.getSmithyContext(context).operation,
        region: (await client.normalizeProvider(config.region)()) ||
            (() => {
                throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
            })(),
    };
};
function createAwsAuthSigv4HttpAuthOption(authParameters) {
    return {
        schemeId: "aws.auth#sigv4",
        signingProperties: {
            name: "sso-oauth",
            region: authParameters.region,
        },
        propertiesExtractor: (config, context) => ({
            signingProperties: {
                config,
                context,
            },
        }),
    };
}
function createSmithyApiNoAuthHttpAuthOption(authParameters) {
    return {
        schemeId: "smithy.api#noAuth",
    };
}
const defaultSSOOIDCHttpAuthSchemeProvider = (authParameters) => {
    const options = [];
    switch (authParameters.operation) {
        case "CreateToken": {
            options.push(createSmithyApiNoAuthHttpAuthOption());
            break;
        }
        default: {
            options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
        }
    }
    return options;
};
const resolveHttpAuthSchemeConfig = (config) => {
    const config_0 = httpAuthSchemes.resolveAwsSdkSigV4Config(config);
    return Object.assign(config_0, {
        authSchemePreference: client.normalizeProvider(config.authSchemePreference ?? []),
    });
};

const resolveClientEndpointParameters = (options) => {
    return Object.assign(options, {
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        defaultSigningName: "sso-oauth",
    });
};
const commonParams = {
    UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
    Endpoint: { type: "builtInParams", name: "endpoint" },
    Region: { type: "builtInParams", name: "region" },
    UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" },
};

var version = "3.997.11";
var packageInfo = {
	version: version};

const k = "ref";
const a = -1, b = true, c = "isSet", d = "PartitionResult", e = "booleanEquals", f = "getAttr", g = { [k]: "Endpoint" }, h = { [k]: d }, i = {}, j = [{ [k]: "Region" }];
const _data = {
    conditions: [
        [c, [g]],
        [c, j],
        ["aws.partition", j, d],
        [e, [{ [k]: "UseFIPS" }, b]],
        [e, [{ [k]: "UseDualStack" }, b]],
        [e, [{ fn: f, argv: [h, "supportsDualStack"] }, b]],
        [e, [{ fn: f, argv: [h, "supportsFIPS"] }, b]],
        ["stringEquals", [{ fn: f, argv: [h, "name"] }, "aws-us-gov"]],
    ],
    results: [
        [a],
        [a, "Invalid Configuration: FIPS and custom endpoint are not supported"],
        [a, "Invalid Configuration: Dualstack and custom endpoint are not supported"],
        [g, i],
        ["https://oidc-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", i],
        [a, "FIPS and DualStack are enabled, but this partition does not support one or both"],
        ["https://oidc.{Region}.amazonaws.com", i],
        ["https://oidc-fips.{Region}.{PartitionResult#dnsSuffix}", i],
        [a, "FIPS is enabled but this partition does not support FIPS"],
        ["https://oidc.{Region}.{PartitionResult#dualStackDnsSuffix}", i],
        [a, "DualStack is enabled but this partition does not support DualStack"],
        ["https://oidc.{Region}.{PartitionResult#dnsSuffix}", i],
        [a, "Invalid Configuration: Missing Region"],
    ],
};
const root = 2;
const r = 100_000_000;
const nodes = new Int32Array([
    -1,
    1,
    -1,
    0,
    13,
    3,
    1,
    4,
    r + 12,
    2,
    5,
    r + 12,
    3,
    8,
    6,
    4,
    7,
    r + 11,
    5,
    r + 9,
    r + 10,
    4,
    11,
    9,
    6,
    10,
    r + 8,
    7,
    r + 6,
    r + 7,
    5,
    12,
    r + 5,
    6,
    r + 4,
    r + 5,
    3,
    r + 1,
    14,
    4,
    r + 2,
    r + 3,
]);
const bdd = endpoints.BinaryDecisionDiagram.from(nodes, root, _data.conditions, _data.results);

const cache = new endpoints.EndpointCache({
    size: 50,
    params: ["Endpoint", "Region", "UseDualStack", "UseFIPS"],
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
    return cache.get(endpointParams, () => endpoints.decideEndpoint(bdd, {
        endpointParams: endpointParams,
        logger: context.logger,
    }));
};
endpoints.customEndpointFunctions.aws = client$1.awsEndpointFunctions;

class SSOOIDCServiceException extends client.ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, SSOOIDCServiceException.prototype);
    }
}

class AccessDeniedException extends SSOOIDCServiceException {
    name = "AccessDeniedException";
    $fault = "client";
    error;
    reason;
    error_description;
    constructor(opts) {
        super({
            name: "AccessDeniedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, AccessDeniedException.prototype);
        this.error = opts.error;
        this.reason = opts.reason;
        this.error_description = opts.error_description;
    }
}
class AuthorizationPendingException extends SSOOIDCServiceException {
    name = "AuthorizationPendingException";
    $fault = "client";
    error;
    error_description;
    constructor(opts) {
        super({
            name: "AuthorizationPendingException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, AuthorizationPendingException.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
    }
}
class ExpiredTokenException extends SSOOIDCServiceException {
    name = "ExpiredTokenException";
    $fault = "client";
    error;
    error_description;
    constructor(opts) {
        super({
            name: "ExpiredTokenException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ExpiredTokenException.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
    }
}
class InternalServerException extends SSOOIDCServiceException {
    name = "InternalServerException";
    $fault = "server";
    error;
    error_description;
    constructor(opts) {
        super({
            name: "InternalServerException",
            $fault: "server",
            ...opts,
        });
        Object.setPrototypeOf(this, InternalServerException.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
    }
}
class InvalidClientException extends SSOOIDCServiceException {
    name = "InvalidClientException";
    $fault = "client";
    error;
    error_description;
    constructor(opts) {
        super({
            name: "InvalidClientException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidClientException.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
    }
}
class InvalidGrantException extends SSOOIDCServiceException {
    name = "InvalidGrantException";
    $fault = "client";
    error;
    error_description;
    constructor(opts) {
        super({
            name: "InvalidGrantException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidGrantException.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
    }
}
class InvalidRequestException extends SSOOIDCServiceException {
    name = "InvalidRequestException";
    $fault = "client";
    error;
    reason;
    error_description;
    constructor(opts) {
        super({
            name: "InvalidRequestException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidRequestException.prototype);
        this.error = opts.error;
        this.reason = opts.reason;
        this.error_description = opts.error_description;
    }
}
class InvalidScopeException extends SSOOIDCServiceException {
    name = "InvalidScopeException";
    $fault = "client";
    error;
    error_description;
    constructor(opts) {
        super({
            name: "InvalidScopeException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidScopeException.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
    }
}
class SlowDownException extends SSOOIDCServiceException {
    name = "SlowDownException";
    $fault = "client";
    error;
    error_description;
    constructor(opts) {
        super({
            name: "SlowDownException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, SlowDownException.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
    }
}
class UnauthorizedClientException extends SSOOIDCServiceException {
    name = "UnauthorizedClientException";
    $fault = "client";
    error;
    error_description;
    constructor(opts) {
        super({
            name: "UnauthorizedClientException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnauthorizedClientException.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
    }
}
class UnsupportedGrantTypeException extends SSOOIDCServiceException {
    name = "UnsupportedGrantTypeException";
    $fault = "client";
    error;
    error_description;
    constructor(opts) {
        super({
            name: "UnsupportedGrantTypeException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnsupportedGrantTypeException.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
    }
}

const _ADE = "AccessDeniedException";
const _APE = "AuthorizationPendingException";
const _AT = "AccessToken";
const _CS = "ClientSecret";
const _CT = "CreateToken";
const _CTR = "CreateTokenRequest";
const _CTRr = "CreateTokenResponse";
const _CV = "CodeVerifier";
const _ETE = "ExpiredTokenException";
const _ICE = "InvalidClientException";
const _IGE = "InvalidGrantException";
const _IRE = "InvalidRequestException";
const _ISE = "InternalServerException";
const _ISEn = "InvalidScopeException";
const _IT = "IdToken";
const _RT = "RefreshToken";
const _SDE = "SlowDownException";
const _UCE = "UnauthorizedClientException";
const _UGTE = "UnsupportedGrantTypeException";
const _aT = "accessToken";
const _c = "client";
const _cI = "clientId";
const _cS = "clientSecret";
const _cV = "codeVerifier";
const _co = "code";
const _dC = "deviceCode";
const _e = "error";
const _eI = "expiresIn";
const _ed = "error_description";
const _gT = "grantType";
const _h = "http";
const _hE = "httpError";
const _iT = "idToken";
const _r = "reason";
const _rT = "refreshToken";
const _rU = "redirectUri";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.ssooidc";
const _sc = "scope";
const _se = "server";
const _tT = "tokenType";
const n0 = "com.amazonaws.ssooidc";
const _s_registry = schema.TypeRegistry.for(_s);
var SSOOIDCServiceException$ = [-3, _s, "SSOOIDCServiceException", 0, [], []];
_s_registry.registerError(SSOOIDCServiceException$, SSOOIDCServiceException);
const n0_registry = schema.TypeRegistry.for(n0);
var AccessDeniedException$ = [
    -3,
    n0,
    _ADE,
    { [_e]: _c, [_hE]: 400 },
    [_e, _r, _ed],
    [0, 0, 0],
];
n0_registry.registerError(AccessDeniedException$, AccessDeniedException);
var AuthorizationPendingException$ = [
    -3,
    n0,
    _APE,
    { [_e]: _c, [_hE]: 400 },
    [_e, _ed],
    [0, 0],
];
n0_registry.registerError(AuthorizationPendingException$, AuthorizationPendingException);
var ExpiredTokenException$ = [-3, n0, _ETE, { [_e]: _c, [_hE]: 400 }, [_e, _ed], [0, 0]];
n0_registry.registerError(ExpiredTokenException$, ExpiredTokenException);
var InternalServerException$ = [-3, n0, _ISE, { [_e]: _se, [_hE]: 500 }, [_e, _ed], [0, 0]];
n0_registry.registerError(InternalServerException$, InternalServerException);
var InvalidClientException$ = [-3, n0, _ICE, { [_e]: _c, [_hE]: 401 }, [_e, _ed], [0, 0]];
n0_registry.registerError(InvalidClientException$, InvalidClientException);
var InvalidGrantException$ = [-3, n0, _IGE, { [_e]: _c, [_hE]: 400 }, [_e, _ed], [0, 0]];
n0_registry.registerError(InvalidGrantException$, InvalidGrantException);
var InvalidRequestException$ = [
    -3,
    n0,
    _IRE,
    { [_e]: _c, [_hE]: 400 },
    [_e, _r, _ed],
    [0, 0, 0],
];
n0_registry.registerError(InvalidRequestException$, InvalidRequestException);
var InvalidScopeException$ = [-3, n0, _ISEn, { [_e]: _c, [_hE]: 400 }, [_e, _ed], [0, 0]];
n0_registry.registerError(InvalidScopeException$, InvalidScopeException);
var SlowDownException$ = [-3, n0, _SDE, { [_e]: _c, [_hE]: 400 }, [_e, _ed], [0, 0]];
n0_registry.registerError(SlowDownException$, SlowDownException);
var UnauthorizedClientException$ = [
    -3,
    n0,
    _UCE,
    { [_e]: _c, [_hE]: 400 },
    [_e, _ed],
    [0, 0],
];
n0_registry.registerError(UnauthorizedClientException$, UnauthorizedClientException);
var UnsupportedGrantTypeException$ = [
    -3,
    n0,
    _UGTE,
    { [_e]: _c, [_hE]: 400 },
    [_e, _ed],
    [0, 0],
];
n0_registry.registerError(UnsupportedGrantTypeException$, UnsupportedGrantTypeException);
const errorTypeRegistries = [_s_registry, n0_registry];
var AccessToken = [0, n0, _AT, 8, 0];
var ClientSecret = [0, n0, _CS, 8, 0];
var CodeVerifier = [0, n0, _CV, 8, 0];
var IdToken = [0, n0, _IT, 8, 0];
var RefreshToken = [0, n0, _RT, 8, 0];
var CreateTokenRequest$ = [
    3,
    n0,
    _CTR,
    0,
    [_cI, _cS, _gT, _dC, _co, _rT, _sc, _rU, _cV],
    [0, [() => ClientSecret, 0], 0, 0, 0, [() => RefreshToken, 0], 64 | 0, 0, [() => CodeVerifier, 0]],
    3,
];
var CreateTokenResponse$ = [
    3,
    n0,
    _CTRr,
    0,
    [_aT, _tT, _eI, _rT, _iT],
    [[() => AccessToken, 0], 0, 1, [() => RefreshToken, 0], [() => IdToken, 0]],
];
var CreateToken$ = [
    9,
    n0,
    _CT,
    { [_h]: ["POST", "/token", 200] },
    () => CreateTokenRequest$,
    () => CreateTokenResponse$,
];

const getRuntimeConfig$1 = (config) => {
    return {
        apiVersion: "2019-06-10",
        base64Decoder: config?.base64Decoder ?? serde.fromBase64,
        base64Encoder: config?.base64Encoder ?? serde.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSSOOIDCHttpAuthSchemeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
            {
                schemeId: "aws.auth#sigv4",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
                signer: new httpAuthSchemes.AwsSdkSigV4Signer(),
            },
            {
                schemeId: "smithy.api#noAuth",
                identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
                signer: new core.NoAuthSigner(),
            },
        ],
        logger: config?.logger ?? new client.NoOpLogger(),
        protocol: config?.protocol ?? protocols$1.AwsRestJsonProtocol,
        protocolSettings: config?.protocolSettings ?? {
            defaultNamespace: "com.amazonaws.ssooidc",
            errorTypeRegistries,
            version: "2019-06-10",
            serviceTarget: "AWSSSOOIDCService",
        },
        serviceId: config?.serviceId ?? "SSO OIDC",
        urlParser: config?.urlParser ?? protocols.parseUrl,
        utf8Decoder: config?.utf8Decoder ?? serde.fromUtf8,
        utf8Encoder: config?.utf8Encoder ?? serde.toUtf8,
    };
};

const getRuntimeConfig = (config$1) => {
    client.emitWarningIfUnsupportedVersion(process.version);
    const defaultsMode = config.resolveDefaultsModeConfig(config$1);
    const defaultConfigProvider = () => defaultsMode().then(client.loadConfigsForDefaultMode);
    const clientSharedValues = getRuntimeConfig$1(config$1);
    client$1.emitWarningIfUnsupportedVersion(process.version);
    const loaderConfig = {
        profile: config$1?.profile,
        logger: clientSharedValues.logger,
    };
    return {
        ...clientSharedValues,
        ...config$1,
        runtime: "node",
        defaultsMode,
        authSchemePreference: config$1?.authSchemePreference ?? config.loadConfig(httpAuthSchemes.NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
        bodyLengthChecker: config$1?.bodyLengthChecker ?? serde.calculateBodyLength,
        defaultUserAgentProvider: config$1?.defaultUserAgentProvider ??
            client$1.createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: packageInfo.version }),
        maxAttempts: config$1?.maxAttempts ?? config.loadConfig(retry.NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config$1),
        region: config$1?.region ??
            config.loadConfig(config.NODE_REGION_CONFIG_OPTIONS, { ...config.NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
        requestHandler: nodeHttpHandler.NodeHttpHandler.create(config$1?.requestHandler ?? defaultConfigProvider),
        retryMode: config$1?.retryMode ??
            config.loadConfig({
                ...retry.NODE_RETRY_MODE_CONFIG_OPTIONS,
                default: async () => (await defaultConfigProvider()).retryMode || retry.DEFAULT_RETRY_MODE,
            }, config$1),
        sha256: config$1?.sha256 ?? serde.Hash.bind(null, "sha256"),
        streamCollector: config$1?.streamCollector ?? nodeHttpHandler.streamCollector,
        useDualstackEndpoint: config$1?.useDualstackEndpoint ?? config.loadConfig(config.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
        useFipsEndpoint: config$1?.useFipsEndpoint ?? config.loadConfig(config.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
        userAgentAppId: config$1?.userAgentAppId ?? config.loadConfig(client$1.NODE_APP_ID_CONFIG_OPTIONS, loaderConfig),
    };
};

const getHttpAuthExtensionConfiguration = (runtimeConfig) => {
    const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
    let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
    let _credentials = runtimeConfig.credentials;
    return {
        setHttpAuthScheme(httpAuthScheme) {
            const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
            if (index === -1) {
                _httpAuthSchemes.push(httpAuthScheme);
            }
            else {
                _httpAuthSchemes.splice(index, 1, httpAuthScheme);
            }
        },
        httpAuthSchemes() {
            return _httpAuthSchemes;
        },
        setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
            _httpAuthSchemeProvider = httpAuthSchemeProvider;
        },
        httpAuthSchemeProvider() {
            return _httpAuthSchemeProvider;
        },
        setCredentials(credentials) {
            _credentials = credentials;
        },
        credentials() {
            return _credentials;
        },
    };
};
const resolveHttpAuthRuntimeConfig = (config) => {
    return {
        httpAuthSchemes: config.httpAuthSchemes(),
        httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
        credentials: config.credentials(),
    };
};

const resolveRuntimeExtensions = (runtimeConfig, extensions) => {
    const extensionConfiguration = Object.assign(client$1.getAwsRegionExtensionConfiguration(runtimeConfig), client.getDefaultExtensionConfiguration(runtimeConfig), protocols.getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
    extensions.forEach((extension) => extension.configure(extensionConfiguration));
    return Object.assign(runtimeConfig, client$1.resolveAwsRegionExtensionConfiguration(extensionConfiguration), client.resolveDefaultRuntimeConfig(extensionConfiguration), protocols.resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
};

class SSOOIDCClient extends client.Client {
    config;
    constructor(...[configuration]) {
        const _config_0 = getRuntimeConfig(configuration || {});
        super(_config_0);
        this.initConfig = _config_0;
        const _config_1 = resolveClientEndpointParameters(_config_0);
        const _config_2 = client$1.resolveUserAgentConfig(_config_1);
        const _config_3 = retry.resolveRetryConfig(_config_2);
        const _config_4 = config.resolveRegionConfig(_config_3);
        const _config_5 = client$1.resolveHostHeaderConfig(_config_4);
        const _config_6 = endpoints.resolveEndpointConfig(_config_5);
        const _config_7 = resolveHttpAuthSchemeConfig(_config_6);
        const _config_8 = resolveRuntimeExtensions(_config_7, configuration?.extensions || []);
        this.config = _config_8;
        this.middlewareStack.use(schema.getSchemaSerdePlugin(this.config));
        this.middlewareStack.use(client$1.getUserAgentPlugin(this.config));
        this.middlewareStack.use(retry.getRetryPlugin(this.config));
        this.middlewareStack.use(protocols.getContentLengthPlugin(this.config));
        this.middlewareStack.use(client$1.getHostHeaderPlugin(this.config));
        this.middlewareStack.use(client$1.getLoggerPlugin(this.config));
        this.middlewareStack.use(client$1.getRecursionDetectionPlugin(this.config));
        this.middlewareStack.use(core.getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
            httpAuthSchemeParametersProvider: defaultSSOOIDCHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new core.DefaultIdentityProviderConfig({
                "aws.auth#sigv4": config.credentials,
            }),
        }));
        this.middlewareStack.use(core.getHttpSigningPlugin(this.config));
    }
    destroy() {
        super.destroy();
    }
}

class CreateTokenCommand extends client.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [endpoints.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AWSSSOOIDCService", "CreateToken", {})
    .n("SSOOIDCClient", "CreateTokenCommand")
    .sc(CreateToken$)
    .build() {
}

const commands = {
    CreateTokenCommand,
};
class SSOOIDC extends SSOOIDCClient {
}
client.createAggregatedClient(commands, SSOOIDC);

const AccessDeniedExceptionReason = {
    KMS_ACCESS_DENIED: "KMS_AccessDeniedException",
};
const InvalidRequestExceptionReason = {
    KMS_DISABLED_KEY: "KMS_DisabledException",
    KMS_INVALID_KEY_USAGE: "KMS_InvalidKeyUsageException",
    KMS_INVALID_STATE: "KMS_InvalidStateException",
    KMS_KEY_NOT_FOUND: "KMS_NotFoundException",
};

__webpack_unused_export__ = client.Command;
__webpack_unused_export__ = client.Client;
__webpack_unused_export__ = AccessDeniedException;
__webpack_unused_export__ = AccessDeniedException$;
__webpack_unused_export__ = AccessDeniedExceptionReason;
__webpack_unused_export__ = AuthorizationPendingException;
__webpack_unused_export__ = AuthorizationPendingException$;
__webpack_unused_export__ = CreateToken$;
exports.CreateTokenCommand = CreateTokenCommand;
__webpack_unused_export__ = CreateTokenRequest$;
__webpack_unused_export__ = CreateTokenResponse$;
__webpack_unused_export__ = ExpiredTokenException;
__webpack_unused_export__ = ExpiredTokenException$;
__webpack_unused_export__ = InternalServerException;
__webpack_unused_export__ = InternalServerException$;
__webpack_unused_export__ = InvalidClientException;
__webpack_unused_export__ = InvalidClientException$;
__webpack_unused_export__ = InvalidGrantException;
__webpack_unused_export__ = InvalidGrantException$;
__webpack_unused_export__ = InvalidRequestException;
__webpack_unused_export__ = InvalidRequestException$;
__webpack_unused_export__ = InvalidRequestExceptionReason;
__webpack_unused_export__ = InvalidScopeException;
__webpack_unused_export__ = InvalidScopeException$;
__webpack_unused_export__ = SSOOIDC;
exports.SSOOIDCClient = SSOOIDCClient;
__webpack_unused_export__ = SSOOIDCServiceException;
__webpack_unused_export__ = SSOOIDCServiceException$;
__webpack_unused_export__ = SlowDownException;
__webpack_unused_export__ = SlowDownException$;
__webpack_unused_export__ = UnauthorizedClientException;
__webpack_unused_export__ = UnauthorizedClientException$;
__webpack_unused_export__ = UnsupportedGrantTypeException;
__webpack_unused_export__ = UnsupportedGrantTypeException$;
__webpack_unused_export__ = errorTypeRegistries;


/***/ })

};

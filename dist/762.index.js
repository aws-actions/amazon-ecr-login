export const id = 762;
export const ids = [762];
export const modules = {

/***/ 9762:
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

const defaultSigninHttpAuthSchemeParametersProvider = async (config, context, input) => {
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
            name: "signin",
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
const defaultSigninHttpAuthSchemeProvider = (authParameters) => {
    const options = [];
    switch (authParameters.operation) {
        case "CreateOAuth2Token": {
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
        defaultSigningName: "signin",
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

const m = "ref";
const a = -1, b = true, c = "isSet", d = "PartitionResult", e = "booleanEquals", f = "getAttr", g = "stringEquals", h = { [m]: "Endpoint" }, i = { [m]: d }, j = { fn: f, argv: [i, "name"] }, k = {}, l = [{ [m]: "Region" }];
const _data = {
    conditions: [
        [c, [h]],
        [c, l],
        ["aws.partition", l, d],
        [e, [{ [m]: "UseFIPS" }, b]],
        [e, [{ [m]: "UseDualStack" }, b]],
        [e, [{ fn: f, argv: [i, "supportsDualStack"] }, b]],
        [e, [{ fn: f, argv: [i, "supportsFIPS"] }, b]],
        [g, [j, "aws"]],
        [g, [j, "aws-cn"]],
        [g, [j, "aws-us-gov"]],
    ],
    results: [
        [a],
        [a, "Invalid Configuration: FIPS and custom endpoint are not supported"],
        [a, "Invalid Configuration: Dualstack and custom endpoint are not supported"],
        [h, k],
        ["https://{Region}.signin.aws.amazon.com", k],
        ["https://{Region}.signin.amazonaws.cn", k],
        ["https://{Region}.signin.amazonaws-us-gov.com", k],
        ["https://signin-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", k],
        [a, "FIPS and DualStack are enabled, but this partition does not support one or both"],
        ["https://signin-fips.{Region}.{PartitionResult#dnsSuffix}", k],
        [a, "FIPS is enabled but this partition does not support FIPS"],
        ["https://signin.{Region}.{PartitionResult#dualStackDnsSuffix}", k],
        [a, "DualStack is enabled but this partition does not support DualStack"],
        ["https://signin.{Region}.{PartitionResult#dnsSuffix}", k],
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
    15,
    3,
    1,
    4,
    r + 14,
    2,
    5,
    r + 14,
    3,
    11,
    6,
    4,
    10,
    7,
    7,
    r + 4,
    8,
    8,
    r + 5,
    9,
    9,
    r + 6,
    r + 13,
    5,
    r + 11,
    r + 12,
    4,
    13,
    12,
    6,
    r + 9,
    r + 10,
    5,
    14,
    r + 8,
    6,
    r + 7,
    r + 8,
    3,
    r + 1,
    16,
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

class SigninServiceException extends client.ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, SigninServiceException.prototype);
    }
}

class AccessDeniedException extends SigninServiceException {
    name = "AccessDeniedException";
    $fault = "client";
    error;
    constructor(opts) {
        super({
            name: "AccessDeniedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, AccessDeniedException.prototype);
        this.error = opts.error;
    }
}
class InternalServerException extends SigninServiceException {
    name = "InternalServerException";
    $fault = "server";
    error;
    constructor(opts) {
        super({
            name: "InternalServerException",
            $fault: "server",
            ...opts,
        });
        Object.setPrototypeOf(this, InternalServerException.prototype);
        this.error = opts.error;
    }
}
class TooManyRequestsError extends SigninServiceException {
    name = "TooManyRequestsError";
    $fault = "client";
    error;
    constructor(opts) {
        super({
            name: "TooManyRequestsError",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TooManyRequestsError.prototype);
        this.error = opts.error;
    }
}
class ValidationException extends SigninServiceException {
    name = "ValidationException";
    $fault = "client";
    error;
    constructor(opts) {
        super({
            name: "ValidationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ValidationException.prototype);
        this.error = opts.error;
    }
}

const _ADE = "AccessDeniedException";
const _AT = "AccessToken";
const _COAT = "CreateOAuth2Token";
const _COATR = "CreateOAuth2TokenRequest";
const _COATRB = "CreateOAuth2TokenRequestBody";
const _COATRBr = "CreateOAuth2TokenResponseBody";
const _COATRr = "CreateOAuth2TokenResponse";
const _ISE = "InternalServerException";
const _RT = "RefreshToken";
const _TMRE = "TooManyRequestsError";
const _VE = "ValidationException";
const _aKI = "accessKeyId";
const _aT = "accessToken";
const _c = "client";
const _cI = "clientId";
const _cV = "codeVerifier";
const _co = "code";
const _e = "error";
const _eI = "expiresIn";
const _gT = "grantType";
const _h = "http";
const _hE = "httpError";
const _iT = "idToken";
const _jN = "jsonName";
const _m = "message";
const _rT = "refreshToken";
const _rU = "redirectUri";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.signin";
const _sAK = "secretAccessKey";
const _sT = "sessionToken";
const _se = "server";
const _tI = "tokenInput";
const _tO = "tokenOutput";
const _tT = "tokenType";
const n0 = "com.amazonaws.signin";
const _s_registry = schema.TypeRegistry.for(_s);
var SigninServiceException$ = [-3, _s, "SigninServiceException", 0, [], []];
_s_registry.registerError(SigninServiceException$, SigninServiceException);
const n0_registry = schema.TypeRegistry.for(n0);
var AccessDeniedException$ = [-3, n0, _ADE, { [_e]: _c }, [_e, _m], [0, 0], 2];
n0_registry.registerError(AccessDeniedException$, AccessDeniedException);
var InternalServerException$ = [-3, n0, _ISE, { [_e]: _se, [_hE]: 500 }, [_e, _m], [0, 0], 2];
n0_registry.registerError(InternalServerException$, InternalServerException);
var TooManyRequestsError$ = [-3, n0, _TMRE, { [_e]: _c, [_hE]: 429 }, [_e, _m], [0, 0], 2];
n0_registry.registerError(TooManyRequestsError$, TooManyRequestsError);
var ValidationException$ = [-3, n0, _VE, { [_e]: _c, [_hE]: 400 }, [_e, _m], [0, 0], 2];
n0_registry.registerError(ValidationException$, ValidationException);
const errorTypeRegistries = [_s_registry, n0_registry];
var RefreshToken = [0, n0, _RT, 8, 0];
var AccessToken$ = [
    3,
    n0,
    _AT,
    8,
    [_aKI, _sAK, _sT],
    [
        [0, { [_jN]: _aKI }],
        [0, { [_jN]: _sAK }],
        [0, { [_jN]: _sT }],
    ],
    3,
];
var CreateOAuth2TokenRequest$ = [
    3,
    n0,
    _COATR,
    0,
    [_tI],
    [[() => CreateOAuth2TokenRequestBody$, 16]],
    1,
];
var CreateOAuth2TokenRequestBody$ = [
    3,
    n0,
    _COATRB,
    0,
    [_cI, _gT, _co, _rU, _cV, _rT],
    [
        [0, { [_jN]: _cI }],
        [0, { [_jN]: _gT }],
        0,
        [0, { [_jN]: _rU }],
        [0, { [_jN]: _cV }],
        [() => RefreshToken, { [_jN]: _rT }],
    ],
    2,
];
var CreateOAuth2TokenResponse$ = [
    3,
    n0,
    _COATRr,
    0,
    [_tO],
    [[() => CreateOAuth2TokenResponseBody$, 16]],
    1,
];
var CreateOAuth2TokenResponseBody$ = [
    3,
    n0,
    _COATRBr,
    0,
    [_aT, _tT, _eI, _rT, _iT],
    [
        [() => AccessToken$, { [_jN]: _aT }],
        [0, { [_jN]: _tT }],
        [1, { [_jN]: _eI }],
        [() => RefreshToken, { [_jN]: _rT }],
        [0, { [_jN]: _iT }],
    ],
    4,
];
var CreateOAuth2Token$ = [
    9,
    n0,
    _COAT,
    { [_h]: ["POST", "/v1/token", 200] },
    () => CreateOAuth2TokenRequest$,
    () => CreateOAuth2TokenResponse$,
];

const getRuntimeConfig$1 = (config) => {
    return {
        apiVersion: "2023-01-01",
        base64Decoder: config?.base64Decoder ?? serde.fromBase64,
        base64Encoder: config?.base64Encoder ?? serde.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSigninHttpAuthSchemeProvider,
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
            defaultNamespace: "com.amazonaws.signin",
            errorTypeRegistries,
            version: "2023-01-01",
            serviceTarget: "Signin",
        },
        serviceId: config?.serviceId ?? "Signin",
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

class SigninClient extends client.Client {
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
            httpAuthSchemeParametersProvider: defaultSigninHttpAuthSchemeParametersProvider,
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

class CreateOAuth2TokenCommand extends client.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [endpoints.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("Signin", "CreateOAuth2Token", {})
    .n("SigninClient", "CreateOAuth2TokenCommand")
    .sc(CreateOAuth2Token$)
    .build() {
}

const commands = {
    CreateOAuth2TokenCommand,
};
class Signin extends SigninClient {
}
client.createAggregatedClient(commands, Signin);

const OAuth2ErrorCode = {
    AUTHCODE_EXPIRED: "AUTHCODE_EXPIRED",
    INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
    INVALID_REQUEST: "INVALID_REQUEST",
    SERVER_ERROR: "server_error",
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    USER_CREDENTIALS_CHANGED: "USER_CREDENTIALS_CHANGED",
};

__webpack_unused_export__ = client.Command;
__webpack_unused_export__ = client.Client;
__webpack_unused_export__ = AccessDeniedException;
__webpack_unused_export__ = AccessDeniedException$;
__webpack_unused_export__ = AccessToken$;
__webpack_unused_export__ = CreateOAuth2Token$;
exports.CreateOAuth2TokenCommand = CreateOAuth2TokenCommand;
__webpack_unused_export__ = CreateOAuth2TokenRequest$;
__webpack_unused_export__ = CreateOAuth2TokenRequestBody$;
__webpack_unused_export__ = CreateOAuth2TokenResponse$;
__webpack_unused_export__ = CreateOAuth2TokenResponseBody$;
__webpack_unused_export__ = InternalServerException;
__webpack_unused_export__ = InternalServerException$;
__webpack_unused_export__ = OAuth2ErrorCode;
__webpack_unused_export__ = Signin;
exports.SigninClient = SigninClient;
__webpack_unused_export__ = SigninServiceException;
__webpack_unused_export__ = SigninServiceException$;
__webpack_unused_export__ = TooManyRequestsError;
__webpack_unused_export__ = TooManyRequestsError$;
__webpack_unused_export__ = ValidationException;
__webpack_unused_export__ = ValidationException$;
__webpack_unused_export__ = errorTypeRegistries;


/***/ })

};

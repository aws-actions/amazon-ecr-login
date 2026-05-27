export const id = 819;
export const ids = [819,136];
export const modules = {

/***/ 3819:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
exports.STSClient = exports.AssumeRoleCommand = void 0;
const sts_1 = __webpack_require__(1136);
Object.defineProperty(exports, "AssumeRoleCommand", ({ enumerable: true, get: function () { return sts_1.AssumeRoleCommand; } }));
Object.defineProperty(exports, "STSClient", ({ enumerable: true, get: function () { return sts_1.STSClient; } }));


/***/ }),

/***/ 1136:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



var client$1 = __webpack_require__(5152);
var core = __webpack_require__(402);
var client = __webpack_require__(2658);
var config = __webpack_require__(7291);
var endpoints = __webpack_require__(2085);
var protocols = __webpack_require__(3422);
var retry = __webpack_require__(3609);
var schema = __webpack_require__(6890);
var httpAuthSchemes = __webpack_require__(7523);
var signatureV4MultiRegion = __webpack_require__(5785);
var serde = __webpack_require__(2430);
var nodeHttpHandler = __webpack_require__(2764);
var protocols$1 = __webpack_require__(7288);

const q = "ref";
const a = -1, b = true, c = "isSet", d = "PartitionResult", e = "booleanEquals", f = "stringEquals", g = "getAttr", h = "us-east-1", i = "sigv4", j = "sts", k = "https://sts.{Region}.{PartitionResult#dnsSuffix}", l = { [q]: "Endpoint" }, m = { [q]: "Region" }, n = { [q]: d }, o = {}, p = [m];
const _data = {
    conditions: [
        [c, [l]],
        [c, p],
        ["aws.partition", p, d],
        [e, [{ [q]: "UseFIPS" }, b]],
        [e, [{ [q]: "UseDualStack" }, b]],
        [f, [m, "aws-global"]],
        [e, [{ [q]: "UseGlobalEndpoint" }, b]],
        [f, [m, "eu-central-1"]],
        [e, [{ fn: g, argv: [n, "supportsDualStack"] }, b]],
        [e, [{ fn: g, argv: [n, "supportsFIPS"] }, b]],
        [f, [m, "ap-south-1"]],
        [f, [m, "eu-north-1"]],
        [f, [m, "eu-west-1"]],
        [f, [m, "eu-west-2"]],
        [f, [m, "eu-west-3"]],
        [f, [m, "sa-east-1"]],
        [f, [m, h]],
        [f, [m, "us-east-2"]],
        [f, [m, "us-west-2"]],
        [f, [m, "us-west-1"]],
        [f, [m, "ca-central-1"]],
        [f, [m, "ap-southeast-1"]],
        [f, [m, "ap-northeast-1"]],
        [f, [m, "ap-southeast-2"]],
        [f, [{ fn: g, argv: [n, "name"] }, "aws-us-gov"]],
    ],
    results: [
        [a],
        ["https://sts.amazonaws.com", { authSchemes: [{ name: i, signingName: j, signingRegion: h }] }],
        [k, { authSchemes: [{ name: i, signingName: j, signingRegion: "{Region}" }] }],
        [a, "Invalid Configuration: FIPS and custom endpoint are not supported"],
        [a, "Invalid Configuration: Dualstack and custom endpoint are not supported"],
        [l, o],
        ["https://sts-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", o],
        [a, "FIPS and DualStack are enabled, but this partition does not support one or both"],
        ["https://sts.{Region}.amazonaws.com", o],
        ["https://sts-fips.{Region}.{PartitionResult#dnsSuffix}", o],
        [a, "FIPS is enabled but this partition does not support FIPS"],
        ["https://sts.{Region}.{PartitionResult#dualStackDnsSuffix}", o],
        [a, "DualStack is enabled but this partition does not support DualStack"],
        [k, o],
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
    30,
    3,
    1,
    4,
    r + 14,
    2,
    5,
    r + 14,
    3,
    25,
    6,
    4,
    24,
    7,
    5,
    r + 1,
    8,
    6,
    9,
    r + 13,
    7,
    r + 1,
    10,
    10,
    r + 1,
    11,
    11,
    r + 1,
    12,
    12,
    r + 1,
    13,
    13,
    r + 1,
    14,
    14,
    r + 1,
    15,
    15,
    r + 1,
    16,
    16,
    r + 1,
    17,
    17,
    r + 1,
    18,
    18,
    r + 1,
    19,
    19,
    r + 1,
    20,
    20,
    r + 1,
    21,
    21,
    r + 1,
    22,
    22,
    r + 1,
    23,
    23,
    r + 1,
    r + 2,
    8,
    r + 11,
    r + 12,
    4,
    28,
    26,
    9,
    27,
    r + 10,
    24,
    r + 8,
    r + 9,
    8,
    29,
    r + 7,
    9,
    r + 6,
    r + 7,
    3,
    r + 3,
    31,
    4,
    r + 4,
    r + 5,
]);
const bdd = endpoints.BinaryDecisionDiagram.from(nodes, root, _data.conditions, _data.results);

const cache = new endpoints.EndpointCache({
    size: 50,
    params: ["Endpoint", "Region", "UseDualStack", "UseFIPS", "UseGlobalEndpoint"],
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
    return cache.get(endpointParams, () => endpoints.decideEndpoint(bdd, {
        endpointParams: endpointParams,
        logger: context.logger,
    }));
};
endpoints.customEndpointFunctions.aws = client$1.awsEndpointFunctions;

const createEndpointRuleSetHttpAuthSchemeParametersProvider = (defaultHttpAuthSchemeParametersProvider) => async (config, context, input) => {
    if (!input) {
        throw new Error("Could not find `input` for `defaultEndpointRuleSetHttpAuthSchemeParametersProvider`");
    }
    const defaultParameters = await defaultHttpAuthSchemeParametersProvider(config, context, input);
    const instructionsFn = client.getSmithyContext(context)?.commandInstance?.constructor
        ?.getEndpointParameterInstructions;
    if (!instructionsFn) {
        throw new Error(`getEndpointParameterInstructions() is not defined on '${context.commandName}'`);
    }
    const endpointParameters = await endpoints.resolveParams(input, { getEndpointParameterInstructions: instructionsFn }, config);
    return Object.assign(defaultParameters, endpointParameters);
};
const _defaultSTSHttpAuthSchemeParametersProvider = async (config, context, input) => {
    return {
        operation: client.getSmithyContext(context).operation,
        region: (await client.normalizeProvider(config.region)()) ||
            (() => {
                throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
            })(),
    };
};
const defaultSTSHttpAuthSchemeParametersProvider = createEndpointRuleSetHttpAuthSchemeParametersProvider(_defaultSTSHttpAuthSchemeParametersProvider);
function createAwsAuthSigv4HttpAuthOption(authParameters) {
    return {
        schemeId: "aws.auth#sigv4",
        signingProperties: {
            name: "sts",
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
function createAwsAuthSigv4aHttpAuthOption(authParameters) {
    return {
        schemeId: "aws.auth#sigv4a",
        signingProperties: {
            name: "sts",
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
const createEndpointRuleSetHttpAuthSchemeProvider = (defaultEndpointResolver, defaultHttpAuthSchemeResolver, createHttpAuthOptionFunctions) => {
    const endpointRuleSetHttpAuthSchemeProvider = (authParameters) => {
        const endpoint = defaultEndpointResolver(authParameters);
        const authSchemes = endpoint.properties?.authSchemes;
        if (!authSchemes) {
            return defaultHttpAuthSchemeResolver(authParameters);
        }
        const options = [];
        for (const scheme of authSchemes) {
            const { name: resolvedName, properties = {}, ...rest } = scheme;
            const name = resolvedName.toLowerCase();
            if (resolvedName !== name) {
                console.warn(`HttpAuthScheme has been normalized with lowercasing: '${resolvedName}' to '${name}'`);
            }
            let schemeId;
            if (name === "sigv4a") {
                schemeId = "aws.auth#sigv4a";
                const sigv4Present = authSchemes.find((s) => {
                    const name = s.name.toLowerCase();
                    return name !== "sigv4a" && name.startsWith("sigv4");
                });
                if (signatureV4MultiRegion.SignatureV4MultiRegion.sigv4aDependency() === "none" && sigv4Present) {
                    continue;
                }
            }
            else if (name.startsWith("sigv4")) {
                schemeId = "aws.auth#sigv4";
            }
            else {
                throw new Error(`Unknown HttpAuthScheme found in '@smithy.rules#endpointRuleSet': '${name}'`);
            }
            const createOption = createHttpAuthOptionFunctions[schemeId];
            if (!createOption) {
                throw new Error(`Could not find HttpAuthOption create function for '${schemeId}'`);
            }
            const option = createOption(authParameters);
            option.schemeId = schemeId;
            option.signingProperties = { ...(option.signingProperties || {}), ...rest, ...properties };
            options.push(option);
        }
        return options;
    };
    return endpointRuleSetHttpAuthSchemeProvider;
};
const _defaultSTSHttpAuthSchemeProvider = (authParameters) => {
    const options = [];
    switch (authParameters.operation) {
        case "AssumeRoleWithWebIdentity": {
            options.push(createSmithyApiNoAuthHttpAuthOption());
            options.push(createAwsAuthSigv4aHttpAuthOption(authParameters));
            break;
        }
        default: {
            options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
            options.push(createAwsAuthSigv4aHttpAuthOption(authParameters));
        }
    }
    return options;
};
const defaultSTSHttpAuthSchemeProvider = createEndpointRuleSetHttpAuthSchemeProvider(defaultEndpointResolver, _defaultSTSHttpAuthSchemeProvider, {
    "aws.auth#sigv4": createAwsAuthSigv4HttpAuthOption,
    "aws.auth#sigv4a": createAwsAuthSigv4aHttpAuthOption,
    "smithy.api#noAuth": createSmithyApiNoAuthHttpAuthOption,
});
const resolveHttpAuthSchemeConfig = (config) => {
    const config_0 = httpAuthSchemes.resolveAwsSdkSigV4Config(config);
    const config_1 = httpAuthSchemes.resolveAwsSdkSigV4AConfig(config_0);
    return Object.assign(config_1, {
        authSchemePreference: client.normalizeProvider(config.authSchemePreference ?? []),
    });
};

const resolveClientEndpointParameters = (options) => {
    return Object.assign(options, {
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        useGlobalEndpoint: options.useGlobalEndpoint ?? false,
        defaultSigningName: "sts",
    });
};
const commonParams = {
    UseGlobalEndpoint: { type: "builtInParams", name: "useGlobalEndpoint" },
    UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
    Endpoint: { type: "builtInParams", name: "endpoint" },
    Region: { type: "builtInParams", name: "region" },
    UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" },
};

var version = "3.997.11";
var packageInfo = {
	version: version};

class STSServiceException extends client.ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, STSServiceException.prototype);
    }
}

class ExpiredTokenException extends STSServiceException {
    name = "ExpiredTokenException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ExpiredTokenException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ExpiredTokenException.prototype);
    }
}
class MalformedPolicyDocumentException extends STSServiceException {
    name = "MalformedPolicyDocumentException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "MalformedPolicyDocumentException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, MalformedPolicyDocumentException.prototype);
    }
}
class PackedPolicyTooLargeException extends STSServiceException {
    name = "PackedPolicyTooLargeException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "PackedPolicyTooLargeException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, PackedPolicyTooLargeException.prototype);
    }
}
class RegionDisabledException extends STSServiceException {
    name = "RegionDisabledException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "RegionDisabledException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, RegionDisabledException.prototype);
    }
}
class IDPRejectedClaimException extends STSServiceException {
    name = "IDPRejectedClaimException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "IDPRejectedClaimException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, IDPRejectedClaimException.prototype);
    }
}
class InvalidIdentityTokenException extends STSServiceException {
    name = "InvalidIdentityTokenException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidIdentityTokenException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidIdentityTokenException.prototype);
    }
}
class IDPCommunicationErrorException extends STSServiceException {
    name = "IDPCommunicationErrorException";
    $fault = "client";
    $retryable = {};
    constructor(opts) {
        super({
            name: "IDPCommunicationErrorException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, IDPCommunicationErrorException.prototype);
    }
}

const _A = "Arn";
const _AKI = "AccessKeyId";
const _AR = "AssumeRole";
const _ARI = "AssumedRoleId";
const _ARR = "AssumeRoleRequest";
const _ARRs = "AssumeRoleResponse";
const _ARU = "AssumedRoleUser";
const _ARWWI = "AssumeRoleWithWebIdentity";
const _ARWWIR = "AssumeRoleWithWebIdentityRequest";
const _ARWWIRs = "AssumeRoleWithWebIdentityResponse";
const _Au = "Audience";
const _C = "Credentials";
const _CA = "ContextAssertion";
const _DS = "DurationSeconds";
const _E = "Expiration";
const _EI = "ExternalId";
const _ETE = "ExpiredTokenException";
const _IDPCEE = "IDPCommunicationErrorException";
const _IDPRCE = "IDPRejectedClaimException";
const _IITE = "InvalidIdentityTokenException";
const _K = "Key";
const _MPDE = "MalformedPolicyDocumentException";
const _P = "Policy";
const _PA = "PolicyArns";
const _PAr = "ProviderArn";
const _PC = "ProvidedContexts";
const _PCLT = "ProvidedContextsListType";
const _PCr = "ProvidedContext";
const _PDT = "PolicyDescriptorType";
const _PI = "ProviderId";
const _PPS = "PackedPolicySize";
const _PPTLE = "PackedPolicyTooLargeException";
const _Pr = "Provider";
const _RA = "RoleArn";
const _RDE = "RegionDisabledException";
const _RSN = "RoleSessionName";
const _SAK = "SecretAccessKey";
const _SFWIT = "SubjectFromWebIdentityToken";
const _SI = "SourceIdentity";
const _SN = "SerialNumber";
const _ST = "SessionToken";
const _T = "Tags";
const _TC = "TokenCode";
const _TTK = "TransitiveTagKeys";
const _Ta = "Tag";
const _V = "Value";
const _WIT = "WebIdentityToken";
const _a = "arn";
const _aKST = "accessKeySecretType";
const _aQE = "awsQueryError";
const _c = "client";
const _cTT = "clientTokenType";
const _e = "error";
const _hE = "httpError";
const _m = "message";
const _pDLT = "policyDescriptorListType";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.sts";
const _tLT = "tagListType";
const n0 = "com.amazonaws.sts";
const _s_registry = schema.TypeRegistry.for(_s);
var STSServiceException$ = [-3, _s, "STSServiceException", 0, [], []];
_s_registry.registerError(STSServiceException$, STSServiceException);
const n0_registry = schema.TypeRegistry.for(n0);
var ExpiredTokenException$ = [
    -3,
    n0,
    _ETE,
    { [_aQE]: [`ExpiredTokenException`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0],
];
n0_registry.registerError(ExpiredTokenException$, ExpiredTokenException);
var IDPCommunicationErrorException$ = [
    -3,
    n0,
    _IDPCEE,
    { [_aQE]: [`IDPCommunicationError`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0],
];
n0_registry.registerError(IDPCommunicationErrorException$, IDPCommunicationErrorException);
var IDPRejectedClaimException$ = [
    -3,
    n0,
    _IDPRCE,
    { [_aQE]: [`IDPRejectedClaim`, 403], [_e]: _c, [_hE]: 403 },
    [_m],
    [0],
];
n0_registry.registerError(IDPRejectedClaimException$, IDPRejectedClaimException);
var InvalidIdentityTokenException$ = [
    -3,
    n0,
    _IITE,
    { [_aQE]: [`InvalidIdentityToken`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0],
];
n0_registry.registerError(InvalidIdentityTokenException$, InvalidIdentityTokenException);
var MalformedPolicyDocumentException$ = [
    -3,
    n0,
    _MPDE,
    { [_aQE]: [`MalformedPolicyDocument`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0],
];
n0_registry.registerError(MalformedPolicyDocumentException$, MalformedPolicyDocumentException);
var PackedPolicyTooLargeException$ = [
    -3,
    n0,
    _PPTLE,
    { [_aQE]: [`PackedPolicyTooLarge`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0],
];
n0_registry.registerError(PackedPolicyTooLargeException$, PackedPolicyTooLargeException);
var RegionDisabledException$ = [
    -3,
    n0,
    _RDE,
    { [_aQE]: [`RegionDisabledException`, 403], [_e]: _c, [_hE]: 403 },
    [_m],
    [0],
];
n0_registry.registerError(RegionDisabledException$, RegionDisabledException);
const errorTypeRegistries = [_s_registry, n0_registry];
var accessKeySecretType = [0, n0, _aKST, 8, 0];
var clientTokenType = [0, n0, _cTT, 8, 0];
var AssumedRoleUser$ = [3, n0, _ARU, 0, [_ARI, _A], [0, 0], 2];
var AssumeRoleRequest$ = [
    3,
    n0,
    _ARR,
    0,
    [_RA, _RSN, _PA, _P, _DS, _T, _TTK, _EI, _SN, _TC, _SI, _PC],
    [0, 0, () => policyDescriptorListType, 0, 1, () => tagListType, 64 | 0, 0, 0, 0, 0, () => ProvidedContextsListType],
    2,
];
var AssumeRoleResponse$ = [
    3,
    n0,
    _ARRs,
    0,
    [_C, _ARU, _PPS, _SI],
    [[() => Credentials$, 0], () => AssumedRoleUser$, 1, 0],
];
var AssumeRoleWithWebIdentityRequest$ = [
    3,
    n0,
    _ARWWIR,
    0,
    [_RA, _RSN, _WIT, _PI, _PA, _P, _DS],
    [0, 0, [() => clientTokenType, 0], 0, () => policyDescriptorListType, 0, 1],
    3,
];
var AssumeRoleWithWebIdentityResponse$ = [
    3,
    n0,
    _ARWWIRs,
    0,
    [_C, _SFWIT, _ARU, _PPS, _Pr, _Au, _SI],
    [[() => Credentials$, 0], 0, () => AssumedRoleUser$, 1, 0, 0, 0],
];
var Credentials$ = [
    3,
    n0,
    _C,
    0,
    [_AKI, _SAK, _ST, _E],
    [0, [() => accessKeySecretType, 0], 0, 4],
    4,
];
var PolicyDescriptorType$ = [3, n0, _PDT, 0, [_a], [0]];
var ProvidedContext$ = [3, n0, _PCr, 0, [_PAr, _CA], [0, 0]];
var Tag$ = [3, n0, _Ta, 0, [_K, _V], [0, 0], 2];
var policyDescriptorListType = [1, n0, _pDLT, 0, () => PolicyDescriptorType$];
var ProvidedContextsListType = [1, n0, _PCLT, 0, () => ProvidedContext$];
var tagListType = [1, n0, _tLT, 0, () => Tag$];
var AssumeRole$ = [9, n0, _AR, 0, () => AssumeRoleRequest$, () => AssumeRoleResponse$];
var AssumeRoleWithWebIdentity$ = [
    9,
    n0,
    _ARWWI,
    0,
    () => AssumeRoleWithWebIdentityRequest$,
    () => AssumeRoleWithWebIdentityResponse$,
];

const getRuntimeConfig$1 = (config) => {
    return {
        apiVersion: "2011-06-15",
        base64Decoder: config?.base64Decoder ?? serde.fromBase64,
        base64Encoder: config?.base64Encoder ?? serde.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSTSHttpAuthSchemeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
            {
                schemeId: "aws.auth#sigv4",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
                signer: new httpAuthSchemes.AwsSdkSigV4Signer(),
            },
            {
                schemeId: "aws.auth#sigv4a",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4a"),
                signer: new httpAuthSchemes.AwsSdkSigV4ASigner(),
            },
            {
                schemeId: "smithy.api#noAuth",
                identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
                signer: new core.NoAuthSigner(),
            },
        ],
        logger: config?.logger ?? new client.NoOpLogger(),
        protocol: config?.protocol ?? protocols$1.AwsQueryProtocol,
        protocolSettings: config?.protocolSettings ?? {
            defaultNamespace: "com.amazonaws.sts",
            errorTypeRegistries,
            xmlNamespace: "https://sts.amazonaws.com/doc/2011-06-15/",
            version: "2011-06-15",
            serviceTarget: "AWSSecurityTokenServiceV20110615",
        },
        serviceId: config?.serviceId ?? "STS",
        signerConstructor: config?.signerConstructor ?? signatureV4MultiRegion.SignatureV4MultiRegion,
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
        httpAuthSchemes: config$1?.httpAuthSchemes ?? [
            {
                schemeId: "aws.auth#sigv4",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4") ||
                    (async (idProps) => await config$1.credentialDefaultProvider(idProps?.__config || {})()),
                signer: new httpAuthSchemes.AwsSdkSigV4Signer(),
            },
            {
                schemeId: "aws.auth#sigv4a",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4a"),
                signer: new httpAuthSchemes.AwsSdkSigV4ASigner(),
            },
            {
                schemeId: "smithy.api#noAuth",
                identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
                signer: new core.NoAuthSigner(),
            },
        ],
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
        sigv4aSigningRegionSet: config$1?.sigv4aSigningRegionSet ?? config.loadConfig(httpAuthSchemes.NODE_SIGV4A_CONFIG_OPTIONS, loaderConfig),
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

class STSClient extends client.Client {
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
            httpAuthSchemeParametersProvider: defaultSTSHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new core.DefaultIdentityProviderConfig({
                "aws.auth#sigv4": config.credentials,
                "aws.auth#sigv4a": config.credentials,
            }),
        }));
        this.middlewareStack.use(core.getHttpSigningPlugin(this.config));
    }
    destroy() {
        super.destroy();
    }
}

class AssumeRoleCommand extends client.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [endpoints.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AWSSecurityTokenServiceV20110615", "AssumeRole", {})
    .n("STSClient", "AssumeRoleCommand")
    .sc(AssumeRole$)
    .build() {
}

class AssumeRoleWithWebIdentityCommand extends client.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [endpoints.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AWSSecurityTokenServiceV20110615", "AssumeRoleWithWebIdentity", {})
    .n("STSClient", "AssumeRoleWithWebIdentityCommand")
    .sc(AssumeRoleWithWebIdentity$)
    .build() {
}

const commands = {
    AssumeRoleCommand,
    AssumeRoleWithWebIdentityCommand,
};
class STS extends STSClient {
}
client.createAggregatedClient(commands, STS);

const getAccountIdFromAssumedRoleUser = (assumedRoleUser) => {
    if (typeof assumedRoleUser?.Arn === "string") {
        const arnComponents = assumedRoleUser.Arn.split(":");
        if (arnComponents.length > 4 && arnComponents[4] !== "") {
            return arnComponents[4];
        }
    }
    return undefined;
};
const resolveRegion = async (_region, _parentRegion, credentialProviderLogger, loaderConfig = {}) => {
    const region = typeof _region === "function" ? await _region() : _region;
    const parentRegion = typeof _parentRegion === "function" ? await _parentRegion() : _parentRegion;
    let stsDefaultRegion = "";
    const resolvedRegion = region ?? parentRegion ?? (stsDefaultRegion = await client$1.stsRegionDefaultResolver(loaderConfig)());
    credentialProviderLogger?.debug?.("@aws-sdk/client-sts::resolveRegion", "accepting first of:", `${region} (credential provider clientConfig)`, `${parentRegion} (contextual client)`, `${stsDefaultRegion} (STS default: AWS_REGION, profile region, or us-east-1)`);
    return resolvedRegion;
};
const getDefaultRoleAssumer$1 = (stsOptions, STSClient) => {
    let stsClient;
    let closureSourceCreds;
    return async (sourceCreds, params) => {
        closureSourceCreds = sourceCreds;
        if (!stsClient) {
            const { logger = stsOptions?.parentClientConfig?.logger, profile = stsOptions?.parentClientConfig?.profile, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger, userAgentAppId = stsOptions?.parentClientConfig?.userAgentAppId, } = stsOptions;
            const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger, {
                logger,
                profile,
            });
            const isCompatibleRequestHandler = !isH2(requestHandler);
            stsClient = new STSClient({
                ...stsOptions,
                userAgentAppId,
                profile,
                credentialDefaultProvider: () => async () => closureSourceCreds,
                region: resolvedRegion,
                requestHandler: isCompatibleRequestHandler ? requestHandler : undefined,
                logger: logger,
            });
        }
        const { Credentials, AssumedRoleUser } = await stsClient.send(new AssumeRoleCommand(params));
        if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
            throw new Error(`Invalid response from STS.assumeRole call with role ${params.RoleArn}`);
        }
        const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser);
        const credentials = {
            accessKeyId: Credentials.AccessKeyId,
            secretAccessKey: Credentials.SecretAccessKey,
            sessionToken: Credentials.SessionToken,
            expiration: Credentials.Expiration,
            ...(Credentials.CredentialScope && { credentialScope: Credentials.CredentialScope }),
            ...(accountId && { accountId }),
        };
        client$1.setCredentialFeature(credentials, "CREDENTIALS_STS_ASSUME_ROLE", "i");
        return credentials;
    };
};
const getDefaultRoleAssumerWithWebIdentity$1 = (stsOptions, STSClient) => {
    let stsClient;
    return async (params) => {
        if (!stsClient) {
            const { logger = stsOptions?.parentClientConfig?.logger, profile = stsOptions?.parentClientConfig?.profile, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger, userAgentAppId = stsOptions?.parentClientConfig?.userAgentAppId, } = stsOptions;
            const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger, {
                logger,
                profile,
            });
            const isCompatibleRequestHandler = !isH2(requestHandler);
            stsClient = new STSClient({
                ...stsOptions,
                userAgentAppId,
                profile,
                region: resolvedRegion,
                requestHandler: isCompatibleRequestHandler ? requestHandler : undefined,
                logger: logger,
            });
        }
        const { Credentials, AssumedRoleUser } = await stsClient.send(new AssumeRoleWithWebIdentityCommand(params));
        if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
            throw new Error(`Invalid response from STS.assumeRoleWithWebIdentity call with role ${params.RoleArn}`);
        }
        const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser);
        const credentials = {
            accessKeyId: Credentials.AccessKeyId,
            secretAccessKey: Credentials.SecretAccessKey,
            sessionToken: Credentials.SessionToken,
            expiration: Credentials.Expiration,
            ...(Credentials.CredentialScope && { credentialScope: Credentials.CredentialScope }),
            ...(accountId && { accountId }),
        };
        if (accountId) {
            client$1.setCredentialFeature(credentials, "RESOLVED_ACCOUNT_ID", "T");
        }
        client$1.setCredentialFeature(credentials, "CREDENTIALS_STS_ASSUME_ROLE_WEB_ID", "k");
        return credentials;
    };
};
const isH2 = (requestHandler) => {
    return requestHandler?.metadata?.handlerProtocol === "h2";
};

const getCustomizableStsClientCtor = (baseCtor, customizations) => {
    if (!customizations)
        return baseCtor;
    else
        return class CustomizableSTSClient extends baseCtor {
            constructor(config) {
                super(config);
                for (const customization of customizations) {
                    this.middlewareStack.use(customization);
                }
            }
        };
};
const getDefaultRoleAssumer = (stsOptions = {}, stsPlugins) => getDefaultRoleAssumer$1(stsOptions, getCustomizableStsClientCtor(STSClient, stsPlugins));
const getDefaultRoleAssumerWithWebIdentity = (stsOptions = {}, stsPlugins) => getDefaultRoleAssumerWithWebIdentity$1(stsOptions, getCustomizableStsClientCtor(STSClient, stsPlugins));
const decorateDefaultCredentialProvider = (provider) => (input) => provider({
    roleAssumer: getDefaultRoleAssumer(input),
    roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity(input),
    ...input,
});

exports.$Command = client.Command;
exports.__Client = client.Client;
exports.AssumeRole$ = AssumeRole$;
exports.AssumeRoleCommand = AssumeRoleCommand;
exports.AssumeRoleRequest$ = AssumeRoleRequest$;
exports.AssumeRoleResponse$ = AssumeRoleResponse$;
exports.AssumeRoleWithWebIdentity$ = AssumeRoleWithWebIdentity$;
exports.AssumeRoleWithWebIdentityCommand = AssumeRoleWithWebIdentityCommand;
exports.AssumeRoleWithWebIdentityRequest$ = AssumeRoleWithWebIdentityRequest$;
exports.AssumeRoleWithWebIdentityResponse$ = AssumeRoleWithWebIdentityResponse$;
exports.AssumedRoleUser$ = AssumedRoleUser$;
exports.Credentials$ = Credentials$;
exports.ExpiredTokenException = ExpiredTokenException;
exports.ExpiredTokenException$ = ExpiredTokenException$;
exports.IDPCommunicationErrorException = IDPCommunicationErrorException;
exports.IDPCommunicationErrorException$ = IDPCommunicationErrorException$;
exports.IDPRejectedClaimException = IDPRejectedClaimException;
exports.IDPRejectedClaimException$ = IDPRejectedClaimException$;
exports.InvalidIdentityTokenException = InvalidIdentityTokenException;
exports.InvalidIdentityTokenException$ = InvalidIdentityTokenException$;
exports.MalformedPolicyDocumentException = MalformedPolicyDocumentException;
exports.MalformedPolicyDocumentException$ = MalformedPolicyDocumentException$;
exports.PackedPolicyTooLargeException = PackedPolicyTooLargeException;
exports.PackedPolicyTooLargeException$ = PackedPolicyTooLargeException$;
exports.PolicyDescriptorType$ = PolicyDescriptorType$;
exports.ProvidedContext$ = ProvidedContext$;
exports.RegionDisabledException = RegionDisabledException;
exports.RegionDisabledException$ = RegionDisabledException$;
exports.STS = STS;
exports.STSClient = STSClient;
exports.STSServiceException = STSServiceException;
exports.STSServiceException$ = STSServiceException$;
exports.Tag$ = Tag$;
exports.decorateDefaultCredentialProvider = decorateDefaultCredentialProvider;
exports.errorTypeRegistries = errorTypeRegistries;
exports.getDefaultRoleAssumer = getDefaultRoleAssumer;
exports.getDefaultRoleAssumerWithWebIdentity = getDefaultRoleAssumerWithWebIdentity;


/***/ }),

/***/ 5785:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



var signatureV4 = __webpack_require__(5118);

const signatureV4CrtContainer = {
    CrtSignerV4: null,
};

const SESSION_TOKEN_QUERY_PARAM = "X-Amz-S3session-Token";
const SESSION_TOKEN_HEADER = SESSION_TOKEN_QUERY_PARAM.toLowerCase();
class SignatureV4SignWithCredentials extends signatureV4.SignatureV4 {
    async signWithCredentials(requestToSign, credentials, options) {
        const credentialsWithoutSessionToken = getCredentialsWithoutSessionToken(credentials);
        requestToSign.headers[SESSION_TOKEN_HEADER] = credentials.sessionToken;
        const privateAccess = this;
        setSingleOverride(privateAccess, credentialsWithoutSessionToken);
        return privateAccess.signRequest(requestToSign, options ?? {});
    }
    async presignWithCredentials(requestToSign, credentials, options) {
        const credentialsWithoutSessionToken = getCredentialsWithoutSessionToken(credentials);
        delete requestToSign.headers[SESSION_TOKEN_HEADER];
        requestToSign.headers[SESSION_TOKEN_QUERY_PARAM] = credentials.sessionToken;
        requestToSign.query = requestToSign.query ?? {};
        requestToSign.query[SESSION_TOKEN_QUERY_PARAM] = credentials.sessionToken;
        const privateAccess = this;
        setSingleOverride(privateAccess, credentialsWithoutSessionToken);
        return this.presign(requestToSign, options);
    }
}
function getCredentialsWithoutSessionToken(credentials) {
    return {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        expiration: credentials.expiration,
    };
}
function setSingleOverride(privateAccess, credentialsWithoutSessionToken) {
    const currentCredentialProvider = privateAccess.credentialProvider;
    privateAccess.credentialProvider = () => {
        privateAccess.credentialProvider = currentCredentialProvider;
        return Promise.resolve(credentialsWithoutSessionToken);
    };
}

class SignatureV4MultiRegion {
    sigv4aSigner;
    sigv4Signer;
    signerOptions;
    static sigv4aDependency() {
        if (typeof signatureV4CrtContainer.CrtSignerV4 === "function") {
            return "crt";
        }
        else if (typeof signatureV4.signatureV4aContainer.SignatureV4a === "function") {
            return "js";
        }
        return "none";
    }
    constructor(options) {
        this.sigv4Signer = new SignatureV4SignWithCredentials(options);
        this.signerOptions = options;
    }
    async sign(requestToSign, options = {}) {
        if (options.signingRegion === "*") {
            return this.getSigv4aSigner().sign(requestToSign, options);
        }
        return this.sigv4Signer.sign(requestToSign, options);
    }
    async signWithCredentials(requestToSign, credentials, options = {}) {
        if (options.signingRegion === "*") {
            const signer = this.getSigv4aSigner();
            const CrtSignerV4 = signatureV4CrtContainer.CrtSignerV4;
            if (CrtSignerV4 && signer instanceof CrtSignerV4) {
                return signer.signWithCredentials(requestToSign, credentials, options);
            }
            else {
                throw new Error(`signWithCredentials with signingRegion '*' is only supported when using the CRT dependency @aws-sdk/signature-v4-crt. ` +
                    `Please check whether you have installed the "@aws-sdk/signature-v4-crt" package explicitly. ` +
                    `You must also register the package by calling [require("@aws-sdk/signature-v4-crt");] ` +
                    `or an ESM equivalent such as [import "@aws-sdk/signature-v4-crt";]. ` +
                    `For more information please go to https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt`);
            }
        }
        return this.sigv4Signer.signWithCredentials(requestToSign, credentials, options);
    }
    async presign(originalRequest, options = {}) {
        if (options.signingRegion === "*") {
            const signer = this.getSigv4aSigner();
            const CrtSignerV4 = signatureV4CrtContainer.CrtSignerV4;
            if (CrtSignerV4 && signer instanceof CrtSignerV4) {
                return signer.presign(originalRequest, options);
            }
            else {
                throw new Error(`presign with signingRegion '*' is only supported when using the CRT dependency @aws-sdk/signature-v4-crt. ` +
                    `Please check whether you have installed the "@aws-sdk/signature-v4-crt" package explicitly. ` +
                    `You must also register the package by calling [require("@aws-sdk/signature-v4-crt");] ` +
                    `or an ESM equivalent such as [import "@aws-sdk/signature-v4-crt";]. ` +
                    `For more information please go to https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt`);
            }
        }
        return this.sigv4Signer.presign(originalRequest, options);
    }
    async presignWithCredentials(originalRequest, credentials, options = {}) {
        if (options.signingRegion === "*") {
            throw new Error("Method presignWithCredentials is not supported for [signingRegion=*].");
        }
        return this.sigv4Signer.presignWithCredentials(originalRequest, credentials, options);
    }
    getSigv4aSigner() {
        if (!this.sigv4aSigner) {
            const CrtSignerV4 = signatureV4CrtContainer.CrtSignerV4;
            const JsSigV4aSigner = signatureV4.signatureV4aContainer.SignatureV4a;
            if (this.signerOptions.runtime === "node") {
                if (!CrtSignerV4 && !JsSigV4aSigner) {
                    throw new Error("Neither CRT nor JS SigV4a implementation is available. " +
                        "Please load either @aws-sdk/signature-v4-crt or @aws-sdk/signature-v4a. " +
                        "For more information please go to " +
                        "https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt");
                }
                if (CrtSignerV4 && typeof CrtSignerV4 === "function") {
                    this.sigv4aSigner = new CrtSignerV4({
                        ...this.signerOptions,
                        signingAlgorithm: 1,
                    });
                }
                else if (JsSigV4aSigner && typeof JsSigV4aSigner === "function") {
                    this.sigv4aSigner = new JsSigV4aSigner({
                        ...this.signerOptions,
                    });
                }
                else {
                    throw new Error("Available SigV4a implementation is not a valid constructor. " +
                        "Please ensure you've properly imported @aws-sdk/signature-v4-crt or @aws-sdk/signature-v4a." +
                        "For more information please go to " +
                        "https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt");
                }
            }
            else {
                if (!JsSigV4aSigner || typeof JsSigV4aSigner !== "function") {
                    throw new Error("JS SigV4a implementation is not available or not a valid constructor. " +
                        "Please check whether you have installed the @aws-sdk/signature-v4a package explicitly. The CRT implementation is not available for browsers. " +
                        "You must also register the package by calling [require('@aws-sdk/signature-v4a');] " +
                        "or an ESM equivalent such as [import '@aws-sdk/signature-v4a';]. " +
                        "For more information please go to " +
                        "https://github.com/aws/aws-sdk-js-v3#using-javascript-non-crt-implementation-of-sigv4a");
                }
                this.sigv4aSigner = new JsSigV4aSigner({
                    ...this.signerOptions,
                });
            }
        }
        return this.sigv4aSigner;
    }
}

exports.SignatureV4MultiRegion = SignatureV4MultiRegion;
exports.SignatureV4SignWithCredentials = SignatureV4SignWithCredentials;
exports.signatureV4CrtContainer = signatureV4CrtContainer;


/***/ })

};

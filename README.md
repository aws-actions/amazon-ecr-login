## Amazon ECR "Login" Action for GitHub Actions

Logs in the local Docker client to one or more Amazon ECR Private registries or an Amazon ECR Public registry.

**Table of Contents**

<!-- toc -->

- [New v2 Release](#new-v2-release)
- [Example of Usage](#examples-of-usage)
  - [Building and pushing an image](#building-and-pushing-an-image)
  - [Using an image as a service](#using-an-image-as-a-service)
- [Credentials](#credentials)
  - [AWS credentials](#aws-credentials)
  - [Docker credentials](#docker-credentials)
- [Self-Hosted Runners](#self-hosted-runners)
  - [Proxy configuration](#proxy-configuration)
- [Permissions](#permissions)
  - [ECR Private](#ecr-private)
  - [ECR Public](#ecr-public)
- [Troubleshooting](#troubleshooting)
- [License Summary](#license-summary)
- [Security Disclosures](#security-disclosures)

<!-- tocstop -->

## New v2 Release

In the new major version for this action, the default value of the `mask-password` input has changed from `false` to `true`.

If you are **not** consuming the Docker credentials as outputs in subsequent jobs, you can simply update your action version to `aws-actions/amazon-ecr-login@v2`.

For any customer consuming the Docker credentials as outputs in subsequent jobs:

- If you are relying on the default value of the `mask-password` input, which is currently `false` in v1, your workflow will break when upgrading to v2. To fix this, please set the mask-password input to `false`:

```
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
        with:
          mask-password: 'false'
```

- If you are already setting the `mask-password` input to `false`, you can simply update your action version to `aws-actions/amazon-ecr-login@v2`.

For more information on why this change is being made, see [Masking Docker Credentials in Amazon ECR Login Action](https://github.com/aws-actions/amazon-ecr-login/issues/526).

## Examples of Usage

### Building and pushing an image

#### Before each of the following examples, make sure to include the following:
```yaml
      - name: Checkout repo
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4 # More information on this action can be found below in the 'AWS Credentials' section
        with:
          role-to-assume: arn:aws:iam::123456789012:role/my-github-actions-role
          aws-region: aws-region-1
```

#### Login to Amazon ECR Private, then build and push a Docker image:
```yaml
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push docker image to Amazon ECR
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          REPOSITORY: my-ecr-repo
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $REGISTRY/$REPOSITORY:$IMAGE_TAG .
          docker push $REGISTRY/$REPOSITORY:$IMAGE_TAG
```

#### Login to Amazon ECR Public, then build and push a Docker image:
```yaml
      - name: Login to Amazon ECR Public
        id: login-ecr-public
        uses: aws-actions/amazon-ecr-login@v2
        with:
          registry-type: public

      - name: Build, tag, and push docker image to Amazon ECR Public
        env:
          REGISTRY: ${{ steps.login-ecr-public.outputs.registry }}
          REGISTRY_ALIAS: my-ecr-public-registry-alias
          REPOSITORY: my-ecr-public-repo
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $REGISTRY/$REGISTRY_ALIAS/$REPOSITORY:$IMAGE_TAG .
          docker push $REGISTRY/$REGISTRY_ALIAS/$REPOSITORY:$IMAGE_TAG
```

#### Login to Amazon ECR Private, then package and push a Helm chart:
```yaml
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Package and push helm chart to Amazon ECR
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          REPOSITORY: my-ecr-repo
        run: |
          helm package $REPOSITORY
          helm push $REPOSITORY-0.1.0.tgz oci://$REGISTRY
```

#### Login to Amazon ECR Public, then package and push a Helm chart:
```yaml
      - name: Login to Amazon ECR Public
        id: login-ecr-public
        uses: aws-actions/amazon-ecr-login@v2
        with:
          registry-type: public

      - name: Package and push helm chart to Amazon ECR Public
        env:
          REGISTRY: ${{ steps.login-ecr-public.outputs.registry }}
          REGISTRY_ALIAS: my-ecr-public-registry-alias
          REPOSITORY: my-ecr-public-repo
        run: |
          helm package $REPOSITORY
          helm push $REPOSITORY-0.1.0.tgz oci://$REGISTRY/$REGISTRY_ALIAS
```

Helm uses the same credential store as Docker, so Helm can authenticate with the same credentials that you use for Docker.

### Other use-cases

#### Login to ECR on multiple AWS accounts

```yaml
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/my-github-actions-role
          aws-region: aws-region-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
        with:
          registries: "123456789012,998877665544"
```

The repository on account `998877665544` needs to explicitly grant access to role:
`arn:aws:iam::123456789012:role/my-github-actions-role` in order for cross-account access to work

Please refer to [AWS docs](https://aws.amazon.com/premiumsupport/knowledge-center/secondary-account-access-ecr/)
for details on how to configure ECR policies

#### Run an image as a service

Use the action to output your Docker credentials for logging into ECR Private, then use the credentials to run your private image as a service in another job.

> [!WARNING]
> Setting `mask-password` to `'false'` will log your Docker password output if [debug logging is enabled](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging).
> For more information, see the [Docker Credentials](#docker-credentials) section below.

```yaml
jobs:
  login-to-amazon-ecr:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/my-github-actions-role
          aws-region: us-east-1
          mask-aws-account-id: 'false'
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
        with:
          mask-password: 'false'
    outputs:
      registry: ${{ steps.login-ecr.outputs.registry }}
      docker_username: ${{ steps.login-ecr.outputs.docker_username_123456789012_dkr_ecr_us_east_1_amazonaws_com }} # More information on these outputs can be found below in the 'Docker Credentials' section
      docker_password: ${{ steps.login-ecr.outputs.docker_password_123456789012_dkr_ecr_us_east_1_amazonaws_com }}

  run-with-internal-service:
    name: Run something with an internal image as a service
    needs: login-to-amazon-ecr
    runs-on: ubuntu-latest
    services:
      internal-service:
        image: ${{ needs.login-to-amazon-ecr.outputs.registry }}/my-ecr-repo:latest
        credentials:
          username: ${{ needs.login-to-amazon-ecr.outputs.docker_username }}
          password: ${{ needs.login-to-amazon-ecr.outputs.docker_password }}
        ports:
          - '80:80'
    steps:
      - name: Run steps in container
        run: echo "run steps in container"
```

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

## Credentials

### AWS Credentials

This action relies on the [default behavior of the AWS SDK for Javascript](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html) to determine AWS credentials and region.  Use [the `aws-actions/configure-aws-credentials` action](https://github.com/aws-actions/configure-aws-credentials) to configure the GitHub Actions environment with a role using GitHub's OIDC provider and your desired region.

```yaml
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/my-github-actions-role
          aws-region: us-east-1

      - name: Login to Amazon ECR Private
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
```

We recommend following [Amazon IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html) when using AWS services in GitHub Actions workflows, including:
* [Assume an IAM role](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#bp-workloads-use-roles) to receive temporary credentials. See the [Sample IAM Role CloudFormation Template](https://github.com/aws-actions/configure-aws-credentials#sample-iam-role-cloudformation-template) in the `aws-actions/configure-aws-credentials` action to get an example.
* [Grant least privilege](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege) to the IAM role used in GitHub Actions workflows.  Grant only the permissions required to perform the actions in your GitHub Actions workflows.  See the Permissions section below for the permissions required by this action.
* [Monitor the activity](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#remove-credentials) of the IAM role used in GitHub Actions workflows.

### Docker Credentials
The registry URIs for ECR Private and ECR Public are as follows:
- Registry URI for ECR Private: `123456789012.dkr.ecr.aws-region-1.amazonaws.com`
- Registry URI for ECR Public: `public.ecr.aws`

After logging in, you can access the docker username and password via action outputs using the following format:

If using ECR Private:
- Docker username output: `docker_username_123456789012_dkr_ecr_aws_region_1_amazonaws_com`
- Docker password output: `docker_password_123456789012_dkr_ecr_aws_region_1_amazonaws_com`

If using ECR Public:
- Docker username output: `docker_username_public_ecr_aws`
- Docker password output: `docker_password_public_ecr_aws`

> [!IMPORTANT]
> If **you are not** using the Docker credential outputs, make sure the `mask-password` input is **not set or set to `'true'`**.
> This masks your Docker password and prevents it from being printed to the action logs if you [enable debug logging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging).
> 
> If **you are** using the Docker credential outputs, make sure the `mask-password` input is **set to `'false'`**.
> Masked values cannot be passed to separate jobs (see [this issue](https://github.com/actions/runner/issues/1498#issuecomment-1066836352)).

## Self-Hosted Runners

### Proxy Configuration

If you run in self-hosted environments and/or in secured environments where you need to use a specific proxy, you can set it in the action manually.

Additionally, this action will always consider an already configured proxy in the environment.

Proxy configured via action input:
```yaml
uses: aws-actions/amazon-ecr-login@v2
with:
  http-proxy: "http://companydomain.com:3128"
````

Proxy configured via an environment variable:
```shell
# Your environment configuration
HTTP_PROXY="http://companydomain.com:3128"
```

The action will read the underlying proxy configuration from the environment, and you don't need to configure it in the action.

## Permissions

### ECR Private

To see how and where to implement the permissions below, see the [IAM section in the Amazon ECR User Guide](https://docs.aws.amazon.com/AmazonECR/latest/userguide/security-iam.html).

This action requires the following minimum set of permissions to login to ECR Private:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GetAuthorizationToken",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    }
  ]
}
```

Docker commands in your GitHub Actions workflow, like `docker pull` and `docker push`, may require additional permissions attached to the credentials used by this action.

The following minimum permissions are required for pulling an image from an ECR Private repository:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPull",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
      ],
      "Resource": "arn:aws:ecr:us-east-1:123456789012:repository/my-ecr-repo"
    }
  ]
}
```

The following minimum permissions are required for pushing and pulling images in an ECR Private repository:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPushPull",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:GetDownloadUrlForLayer",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": "arn:aws:ecr:us-east-1:123456789012:repository/my-ecr-repo"
    }
  ]
}
```

### ECR Public

To see how and where to implement the permissions below, see the [IAM section in the Amazon ECR Public User Guide](https://docs.aws.amazon.com/AmazonECR/latest/public/security-iam.html).


This action requires the following minimum set of permissions to login to ECR Public:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GetAuthorizationToken",
      "Effect": "Allow",
      "Action": [
        "ecr-public:GetAuthorizationToken",
        "sts:GetServiceBearerToken"
      ],
      "Resource": "*"
    }
  ]
}
```

Docker commands in your GitHub Actions workflow, like `docker push`, may require additional permissions attached to the credentials used by this action. There are no permissions needed for pulling images from ECR Public.

The following minimum permissions are required for pushing an image to an ECR Public repository:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPush",
      "Effect": "Allow",
      "Action": [
        "ecr-public:BatchCheckLayerAvailability",
        "ecr-public:CompleteLayerUpload",
        "ecr-public:InitiateLayerUpload",
        "ecr-public:PutImage",
        "ecr-public:UploadLayerPart"
      ],
      "Resource": "arn:aws:ecr-public::123456789012:repository/my-ecr-public-repo"
    }
  ]
}
```

## Troubleshooting

### Configure credentials

`Inaccessible host: 'api.ecr-public.aws-region-1.amazonaws.com' at port 'undefined'. This service may not be available in the 'aws-region-1' region.`

- The `AWS_DEFAULT_REGION` environment variable is configured as a region where ECR Public isn't available.
- ECR Public can only be logged into from the `us-east-1` region. In the `aws-actions/configure-aws-credentials` action, the `aws-region` input must be `us-east-1`.

`GetAuthorizationToken command is only supported in us-east-1.`

- The `AWS_DEFAULT_REGION` environment variable is configured as `us-west-2`.
- ECR Public can only be logged into from the `us-east-1` region. In the `aws-actions/configure-aws-credentials` action, the `aws-region` input must be `us-east-1`.

### Inputs

`Invalid parameter at 'registryIds' failed to satisfy constraint: 'Member must satisfy constraint: [Member must satisfy regular expression pattern: [0-9]{12}]'`

- One of the registries you provided in the `registries` input isn't a sequence of 12 digits
- For users providing only a single registry ID in the `registries` input, if the ID begins with a 0, make sure to enclose it in quotes. GitHub Actions will read an input as a number if all of the characters in the input are digits. So if your registry ID begins with a 0, the 0 will be truncated. See issue [#225](https://github.com/aws-actions/amazon-ecr-login/issues/225).

## License Summary

This code is made available under the MIT license.

## Security Disclosures

If you would like to report a potential security issue in this project, please do not create a GitHub issue.  Instead, please follow the instructions [here](https://aws.amazon.com/security/vulnerability-reporting/) or [email AWS security directly](mailto:aws-security@amazon.com).

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.7.1](https://github.com/aws-actions/amazon-ecr-login/compare/v1.7.0...v1.7.1) (2023-10-03)


### Bug Fixes

* update package.yml for 1.x ([78a6870](https://github.com/aws-actions/amazon-ecr-login/commit/78a687010fbdea76aaa964345c47c7f961913e94))

## [1.7.0](https://github.com/aws-actions/amazon-ecr-login/compare/v1.6.2...v1.7.0) (2023-08-09)


### Features

* provide input to optionally mask output docker password ([#491](https://github.com/aws-actions/amazon-ecr-login/issues/491)) ([98f33d2](https://github.com/aws-actions/amazon-ecr-login/commit/98f33d2eaf29c215bd8a595c94896c64d126dbb7))

### [1.6.2](https://github.com/aws-actions/amazon-ecr-login/compare/v1.6.1...v1.6.2) (2023-06-26)


### Bug Fixes

* fix and upgrade https proxy agent ([a3dee4b](https://github.com/aws-actions/amazon-ecr-login/commit/a3dee4b938e3c900ebd9db0943f48225496af8b0))

### [1.6.1](https://github.com/aws-actions/amazon-ecr-login/compare/v1.6.0...v1.6.1) (2023-06-20)


### Bug Fixes

* build issue in release ([402e69a](https://github.com/aws-actions/amazon-ecr-login/commit/402e69a1186c3f46157ad2b0d1c7a21ad57aa8c4))
* update deps ([1b9c8c1](https://github.com/aws-actions/amazon-ecr-login/commit/1b9c8c1c49085f7f594f36e141b0d308604fae9c))

## [1.6.0](https://github.com/aws-actions/amazon-ecr-login/compare/v1.5.3...v1.6.0) (2023-03-29)


### Features

* add support for HTTP(s) proxy ([454a99d](https://github.com/aws-actions/amazon-ecr-login/commit/454a99d5dec5aa76513a9d0085a51722feed79b8))

### [1.5.3](https://github.com/aws-actions/amazon-ecr-login/compare/v1.5.2...v1.5.3) (2022-10-29)

### [1.5.2](https://github.com/aws-actions/amazon-ecr-login/compare/v1.5.1...v1.5.2) (2022-10-18)

### [1.5.1](https://github.com/aws-actions/amazon-ecr-login/compare/v1.5.0...v1.5.1) (2022-08-04)


### Bug Fixes

* reverted change that masked Docker credentials ([7d073b6](https://github.com/aws-actions/amazon-ecr-login/commit/7d073b66cc2799eb766b698980d716db7e62a8b7))

## [1.5.0](https://github.com/aws-actions/amazon-ecr-login/compare/v1.4.0...v1.5.0) (2022-06-27)


### Features

* added ECR Public Registry support ([b4f084e](https://github.com/aws-actions/amazon-ecr-login/commit/b4f084e928b56f43c9afa5773b761bbfcd7e83e2))

## [1.4.0](https://github.com/aws-actions/amazon-ecr-login/compare/v1.3.3...v1.4.0) (2022-05-20)


### Features

* output docker credentials after login ([57206dc](https://github.com/aws-actions/amazon-ecr-login/commit/57206dc28c379a6eebdce44c592109d2e97e031d))
* support for username and password outputs ([d121236](https://github.com/aws-actions/amazon-ecr-login/commit/d121236bfd0a712a9f4bd93767d696874680bc95))


### Bug Fixes

* add-mask to login outputs ([45a78e2](https://github.com/aws-actions/amazon-ecr-login/commit/45a78e2dab5678b27e94cf31545c181e8ca9c044))

### [1.3.3](https://github.com/aws-actions/amazon-ecr-login/compare/v1.3.2...v1.3.3) (2021-02-15)

### [1.3.2](https://github.com/aws-actions/amazon-ecr-login/compare/v1.3.1...v1.3.2) (2021-02-01)

### [1.3.1](https://github.com/aws-actions/amazon-ecr-login/compare/v1.3.0...v1.3.1) (2020-11-24)

## [1.3.0](https://github.com/aws-actions/amazon-ecr-login/compare/v1.2.2...v1.3.0) (2020-10-29)


### Features

* optional skipping of docker registries logout in post step ([#78](https://github.com/aws-actions/amazon-ecr-login/issues/78)) ([dd3fdee](https://github.com/aws-actions/amazon-ecr-login/commit/dd3fdeeb95577a637ece5e647581680afda16e6f))

### [1.2.2](https://github.com/aws-actions/amazon-ecr-login/compare/v1.2.1...v1.2.2) (2020-10-05)

### [1.2.1](https://github.com/aws-actions/amazon-ecr-login/compare/v1.2.0...v1.2.1) (2020-08-25)

## [1.2.0](https://github.com/aws-actions/amazon-ecr-login/compare/v1.1.4...v1.2.0) (2020-08-11)


### Features

* logout docker registries in post step ([#70](https://github.com/aws-actions/amazon-ecr-login/issues/70)) ([6cfbb32](https://github.com/aws-actions/amazon-ecr-login/commit/6cfbb329c3ecc5a7f78c5b7f5a779ad99aa77cea))

### [1.1.4](https://github.com/aws-actions/amazon-ecr-login/compare/v1.1.3...v1.1.4) (2020-07-17)

### [1.1.3](https://github.com/aws-actions/amazon-ecr-login/compare/v1.1.2...v1.1.3) (2020-07-14)

### [1.1.2](https://github.com/aws-actions/amazon-ecr-login/compare/v1.1.1...v1.1.2) (2020-06-30)

### [1.1.1](https://github.com/aws-actions/amazon-ecr-login/compare/v1.1.0...v1.1.1) (2020-06-09)

## [1.1.0](https://github.com/aws-actions/amazon-ecr-login/compare/v1.0.7...v1.1.0) (2020-05-27)


### Features

* output registry URI if single registry ID is provided as input ([#50](https://github.com/aws-actions/amazon-ecr-login/issues/50)) ([cfd96f4](https://github.com/aws-actions/amazon-ecr-login/commit/cfd96f4b0041e43b7473d8e0850bf7fb4471a507))

### [1.0.7](https://github.com/aws-actions/amazon-ecr-login/compare/v1.0.6...v1.0.7) (2020-05-18)

### [1.0.6](https://github.com/aws-actions/amazon-ecr-login/compare/v1.0.5...v1.0.6) (2020-05-08)

### [1.0.5](https://github.com/aws-actions/amazon-ecr-login/compare/v1.0.4...v1.0.5) (2020-04-02)

### [1.0.4](https://github.com/aws-actions/amazon-ecr-login/compare/v1.0.3...v1.0.4) (2020-03-05)


### Bug Fixes

* Add debugging for registry ID input ([127dcbd](https://github.com/aws-actions/amazon-ecr-login/commit/127dcbdc25a788bc50ed461ba2d597287ec9ae1f))

### [1.0.3](https://github.com/aws-actions/amazon-ecr-login/compare/v1.0.2...v1.0.3) (2020-02-07)

### [1.0.2](https://github.com/aws-actions/amazon-ecr-login/compare/v1.0.1...v1.0.2) (2020-02-06)


### Bug Fixes

* Match package version to current tag version ([e254adb](https://github.com/aws-actions/amazon-ecr-login/commit/e254adbeaeb34c7a2d6bd0a6600f3bbf89fc1e5d))

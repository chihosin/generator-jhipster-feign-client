const packagejs = require('../../package.json');
const chalk = require('chalk');
const path = require('path');
const shelljs = require('shelljs');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const fs = require('fs');
const constants = require('generator-jhipster/generators/generator-constants');
const genUtils = require('./utils');

const SERVER_MAIN_SRC_DIR = constants.SERVER_MAIN_SRC_DIR;

const microserviceServerFiles = {
    server: [
        {
            condition: generator => generator.jpaMetamodelFiltering,
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/dto/EntityCriteria.java',
                    renameTo: generator =>
                        `${generator.packageFolder}/web/rest/dto/${
                            generator.entityClass
                        }Criteria.java`
                }
            ]
        },
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/dto/EntityDTO.java',
                    renameTo: generator =>
                        `${generator.packageFolder}/web/rest/dto/${
                            generator.entityClass
                        }DTO.java`
                }
            ]
        },
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/client/EntityClient.java',
                    renameTo: generator =>
                        `${generator.packageFolder}/web/rest/client/${
                            generator.microserviceName
                        }${generator.entityClass}Client.java`
                }
            ]
        },
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/client/EntityClientFallback.java',
                    renameTo: generator =>
                        `${generator.packageFolder}/web/rest/client/${
                            generator.microserviceName
                        }${generator.entityClass}ClientFallback.java`
                }
            ]
        }
    ]
};

const uaaServerFiles = {
    server: [
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/client/UaaAuthorityClient.java',
                    renameTo: generator =>
                        `${generator.packageFolder}/web/rest/client/${
                            generator.uaaClassifyBaseName
                        }AuthorityClient.java`
                }
            ]
        },
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file:
                        'package/web/rest/client/UaaAuthorityClientFallback.java',
                    renameTo: generator =>
                        `${generator.packageFolder}/web/rest/client/${
                            generator.uaaClassifyBaseName
                        }AuthorityClientFallback.java`
                }
            ]
        },
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/client/UaaUserClient.java',
                    renameTo: generator =>
                        `${generator.packageFolder}/web/rest/client/${
                            generator.uaaClassifyBaseName
                        }UserClient.java`
                }
            ]
        },
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/client/UaaUserClientFallback.java',
                    renameTo: generator =>
                        `${generator.packageFolder}/web/rest/client/${
                            generator.uaaClassifyBaseName
                        }UserClientFallback.java`
                }
            ]
        },
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/dto/AuthorityDTO.java',
                    renameTo: generator =>
                        `${
                            generator.packageFolder
                        }/web/rest/dto/AuthorityDTO.java`
                }
            ]
        },
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/dto/UserDTO.java',
                    renameTo: generator =>
                        `${generator.packageFolder}/web/rest/dto/UserDTO.java`
                }
            ]
        },
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/dto/ManagedUsersAuthorityDTO.java',
                    renameTo: generator =>
                        `${
                            generator.packageFolder
                        }/web/rest/dto/ManagedUsersAuthorityDTO.java`
                }
            ]
        }
    ]
};

module.exports = class extends BaseGenerator {
    constructor(args, opts) {
        super(args, opts);
        this.context = {};
    }

    get initializing() {
        return {
            getConfig() {
                const context = this.context;
                context.entityTableName = 'None';
                context.prodDatabaseType = 'None';
                context.databaseType = 'sql';
                context.jhipsterConfigDirectory = '.jhipster';
                context.fieldNamesUnderscored = [];
                context.fieldNameChoices = [];
                context.relNameChoices = [];
                context.filename = `${context.jhipsterConfigDirectory}/${
                    context.entityNameCapitalized
                }.json`;
                if (shelljs.test('-f', context.filename)) {
                    this.log(chalk.green(`\nFound the ${
                        context.filename
                    } configuration file, entity can be automatically generated!\n`));
                    context.useConfigurationFile = true;
                }
            },
            readConfig() {
                this.jhipsterAppConfig = this.getJhipsterAppConfig();
                if (!this.jhipsterAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
                }
                this.uaaAuthentication =
                    this.jhipsterAppConfig.authenticationType === 'uaa';
                this.uaaClient = false;
            },
            displayLogo() {
                this.log('');
                this.log(`${chalk.blue('██████╗ ')}${chalk.red('██')}${chalk.blue('╗ ██████╗ ██████╗ ██╗   ██╗ ██████╗ ')}`);
                this.log(`${chalk.blue('██╔══██╗██║██╔════╝ ██╔══██╗██║   ██║██╔════╝ ')}`);
                this.log(`${chalk.blue('██████╔╝██║██║  ███╗██████╔╝██║   ██║██║  ███╗')}`);
                this.log(`${chalk.blue('██╔══██╗██║██║   ██║██╔══██╗██║   ██║██║   ██║')}`);
                this.log(`${chalk.blue('██████╔╝██║╚██████╔╝██████╔╝╚██████╔╝╚██████╔╝')}`);
                this.log(`${chalk.blue('╚═════╝ ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝ ')}`);
                this.log(chalk.white(`Running ${chalk.bold.blue('JHipster Feign Client')} Generator! ${chalk.yellow(`v${packagejs.version}\n`)}`));
            },
            checkServerFramework() {
                if (this.jhipsterAppConfig.skipServer) {
                    this.env.error(`${chalk.red.bold('ERROR!')} This module works only for server...`);
                }
            },
            checkJhipster() {
                const currentJhipsterVersion = this.jhipsterAppConfig
                    .jhipsterVersion;
                const minimumJhipsterVersion =
                    packagejs.dependencies['generator-jhipster'];
                if (
                    !semver.satisfies(
                        currentJhipsterVersion,
                        minimumJhipsterVersion
                    )
                ) {
                    this.warning(`\nYour generated project used an old JHipster version (${currentJhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
                }
            }
        };
    }

    prompting() {
        const context = this.context;

        function getEntityList(theMicroservicePath) {
            const existingEntities = [];
            const existingEntityChoices = [];
            let existingEntityNames = [];
            existingEntityNames = fs.readdirSync(`${theMicroservicePath}/.jhipster`);
            existingEntityNames.forEach((entry) => {
                if (entry.indexOf('.json') !== -1) {
                    const entityName = entry.replace('.json', '');
                    existingEntities.push(entityName);
                    existingEntityChoices.push({
                        name: entityName,
                        value: entityName
                    });
                }
            });
            return existingEntityChoices;
        }

        const askMicroservicePath = {
            when: !this.uaaAuthentication
                ? true
                : response => response.clientType === 'microservice',
            type: 'input',
            name: 'microservicePath',
            message: 'Enter the path to the microservice root directory:',
            store: true,
            validate: (input) => {
                let fromPath = '';
                if (path.isAbsolute(input)) {
                    // fromPath = `${input}/${context.filename}`;
                    fromPath = `${input}`;
                } else {
                    // fromPath = this.destinationPath(`${input}/${context.filename}`);
                    fromPath = this.destinationPath(`${input}`);
                }

                if (shelljs.test('-d', fromPath)) {
                    return true;
                }
                // return `${context.filename} not found in ${input}/`;
                return `${input} not found`;
            }
        };

        const prompts = [
            {
                type: 'list',
                name: 'clientType',
                message: 'Which feign client do you want to generate?',
                choices: [
                    {
                        name: 'other microservice entities',
                        value: 'microservice'
                    },
                    {
                        name: 'uaa service user and authority entities',
                        value: 'uaa'
                    }
                ],
                default: 'microservice'
            },
            askMicroservicePath,
            {
                when: response => response.clientType === 'microservice',
                type: 'checkbox',
                name: 'entitiesNames',
                message: 'Please choose the entities to be audited',
                choices: response =>
                    getEntityList(response.microservicePath),
                default: 'none'
            }
        ];

        const done = this.async();
        this.prompt(prompts).then((props) => {
            this.props = props;
            if (props.clientType === 'uaa') {
                this.createUaaFeignClient = true;
            }
            if (props.microservicePath) {
                if (path.isAbsolute(props.microservicePath)) {
                    context.microservicePath = props.microservicePath;
                } else {
                    context.microservicePath = path.resolve(props.microservicePath);
                }
                context.useConfigurationFile = true;
                context.useMicroserviceJson = true;
            }
            if (props.entitiesNames) {
                this.entitiesNames = props.entitiesNames;
            }
            done();
        });
    }

    writing() {
        // read config from .yo-rc.json
        this.baseName = this.jhipsterAppConfig.baseName;
        this.packageName = this.jhipsterAppConfig.packageName;
        this.packageFolder = this.jhipsterAppConfig.packageFolder;
        this.clientFramework = this.jhipsterAppConfig.clientFramework;
        this.clientPackageManager = this.jhipsterAppConfig.clientPackageManager;
        this.buildTool = this.jhipsterAppConfig.buildTool;

        if (!this.createUaaFeignClient) {
            this.log(`\n${chalk.bold.green('Creating feign client for microservice')}`);
            this.entitiesNames.forEach((entityName) => {
                this.context.name = entityName;
                this.loadEntityJson(`${
                    this.context.microservicePath
                }/.jhipster/${entityName}.json`);
                genUtils.writeEntityFeignClient(this, microserviceServerFiles);
            });
        } else {
            this.log(`\n${chalk.bold.green('Creating uaa feign client')}`);
            genUtils.writeUaaFeignClient(this, uaaServerFiles);
        }
    }

    end() {
        this.log(`\n${chalk.bold.green('Create feign client for microservice is done')}`);
    }
};

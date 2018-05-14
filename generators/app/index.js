const chalk = require('chalk');
const _ = require('lodash');
const jhiCore = require('jhipster-core');
const pluralize = require('pluralize');
const path = require('path');
const shelljs = require('shelljs');
const utils = require('generator-jhipster/generators/utils');
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');

const INTERPOLATE_REGEX = jhipsterConstants.INTERPOLATE_REGEX;
const SERVER_MAIN_SRC_DIR = jhipsterConstants.SERVER_MAIN_SRC_DIR;
const SERVER_MAIN_RES_DIR = jhipsterConstants.SERVER_MAIN_RES_DIR;
const TEST_DIR = jhipsterConstants.TEST_DIR;
const SERVER_TEST_SRC_DIR = jhipsterConstants.SERVER_TEST_SRC_DIR;

const serverFiles = {
    server: [
        {
            condition: generator => generator.jpaMetamodelFiltering,
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/dto/EntityCriteria.java.ejs',
                    renameTo: generator => `${generator.packageFolder}/web/rest/dto/${generator.entityClass}Criteria.java`
                }
            ]
        },
        {
            path: SERVER_MAIN_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/dto/EntityDTO.java.ejs',
                    renameTo: generator => `${generator.packageFolder}/web/rest/dto/${generator.entityClass}DTO.java`
                }
            ]
        }
    ]
};

module.exports = class extends BaseGenerator {
    constructor(args, opts) {
        super(args, opts);

        // This makes `name` a required argument.
        this.argument('name', {
            type: String,
            required: true,
            description: 'Entity name'
        });

        this.context = {};
        this.setupEntityOptions(this, this, this.context);
    }

    get initializing() {
        return {
            getConfig() {
                const context = this.context;
                context.entityTableName = 'None';
                context.prodDatabaseType = 'None';
                context.databaseType ='None';
                context.jhipsterConfigDirectory = '.jhipster';
                context.filename = `${context.jhipsterConfigDirectory}/${context.entityNameCapitalized}.json`;
                if (shelljs.test('-f', context.filename)) {
                    this.log(chalk.green(`\nFound the ${context.filename} configuration file, entity can be automatically generated!\n`));
                    context.useConfigurationFile = true;
                }
            },
            readConfig() {
                this.jhipsterAppConfig = this.getJhipsterAppConfig();
                if (!this.jhipsterAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
                }
            },
            displayLogo() {
                console.log(this.context);
            },
            checkJhipster() {
                const currentJhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(currentJhipsterVersion, minimumJhipsterVersion)) {
                    this.warning(`\nYour generated project used an old JHipster version (${currentJhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
                }
            }
        };
    }

    prompting() {
        const context = this.context;
        const prompts = [
            {
                type: 'input',
                name: 'microservicePath',
                message: 'Enter the path to the microservice root directory:',
                store: true,
                validate: (input) => {
                    let fromPath = '';
                    if (path.isAbsolute(input)) {
                        fromPath = `${input}/${context.filename}`;
                    } else {
                        fromPath = this.destinationPath(`${input}/${context.filename}`);
                    }

                    if (shelljs.test('-f', fromPath)) {
                        return true;
                    }
                    return `${context.filename} not found in ${input}/`;
                }
            }
        ];

        const done = this.async();
        this.prompt(prompts).then((props) => {
            this.props = props;
            if (props.microservicePath) {
                this.log(chalk.green(`\nFound the ${context.filename} configuration file, entity can be automatically generated!\n`));
                if (path.isAbsolute(props.microservicePath)) {
                    context.microservicePath = props.microservicePath;
                } else {
                    context.microservicePath = path.resolve(props.microservicePath);
                }
                context.useConfigurationFile = true;
                context.useMicroserviceJson = true;
                context.fromPath = `${context.microservicePath}/${context.jhipsterConfigDirectory}/${context.entityNameCapitalized}.json`;
                this.loadEntityJson();
            }
            done();
        });
    }

    writing() {
        const context = this.context;
                const entityName = context.name;
                const entityNamePluralizedAndSpinalCased = _.kebabCase(pluralize(entityName));

                context.entityClass = context.entityNameCapitalized;
                context.entityClassHumanized = _.startCase(context.entityNameCapitalized);
                context.entityClassPlural = pluralize(context.entityClass);
                context.entityClassPluralHumanized = _.startCase(context.entityClassPlural);
                context.entityInstance = _.lowerFirst(entityName);
                context.entityInstancePlural = pluralize(context.entityInstance);
                context.entityApiUrl = entityNamePluralizedAndSpinalCased;
                context.entityFileName = _.kebabCase(context.entityNameCapitalized + _.upperFirst(context.entityAngularJSSuffix));
                // context.entityFolderName = this.getEntityFolderName(context.clientRootFolder, context.entityFileName);
                context.entityModelFileName = context.entityFolderName;
                // context.entityParentPathAddition = this.getEntityParentPathAddition(context.clientRootFolder);
                context.entityPluralFileName = entityNamePluralizedAndSpinalCased + context.entityAngularJSSuffix;
                context.entityServiceFileName = context.entityFileName;
                // context.entityAngularName = context.entityClass + this.upperFirstCamelCase(context.entityAngularJSSuffix);
                // context.entityReactName = context.entityClass + this.upperFirstCamelCase(context.entityAngularJSSuffix);
                context.entityStateName = _.kebabCase(context.entityAngularName);
                context.entityUrl = context.entityStateName;
                context.entityTranslationKey = context.clientRootFolder ? _.camelCase(`${context.clientRootFolder}-${context.entityInstance}`) : context.entityInstance;
                context.entityTranslationKeyMenu = _.camelCase(context.clientRootFolder ? `${context.clientRootFolder}-${context.entityStateName}` : context.entityStateName);
                context.jhiTablePrefix = this.getTableName(context.jhiPrefix);
                context.reactiveRepositories = context.applicationType === 'reactive' && ['mongodb', 'couchbase'].includes(context.databaseType);

                context.fieldsContainDate = false;
                context.fieldsContainInstant = false;
                context.fieldsContainZonedDateTime = false;
                context.fieldsContainLocalDate = false;
                context.fieldsContainBigDecimal = false;
                context.fieldsContainBlob = false;
                context.fieldsContainImageBlob = false;
                context.fieldsContainBlobOrImage = false;
                context.validation = false;
                context.fieldsContainOwnerManyToMany = false;
                context.fieldsContainNoOwnerOneToOne = false;
                context.fieldsContainOwnerOneToOne = false;
                context.fieldsContainOneToMany = false;
                context.fieldsContainManyToOne = false;
                context.fieldsIsReactAvField = false;
                context.blobFields = [];
                context.differentTypes = [context.entityClass];
                if (!context.relationships) {
                    context.relationships = [];
                }
                context.differentRelationships = {};
                context.i18nToLoad = [context.entityInstance];
                context.i18nKeyPrefix = `${context.angularAppName}.${context.entityTranslationKey}`;

                // Load in-memory data for fields
                console.log(context);
                context.fields.forEach((field) => {
                    // Migration from JodaTime to Java Time
                    if (field.fieldType === 'DateTime' || field.fieldType === 'Date') {
                        field.fieldType = 'Instant';
                    }
                    const fieldType = field.fieldType;

                    if (!['Instant', 'ZonedDateTime', 'Boolean'].includes(fieldType)) {
                        context.fieldsIsReactAvField = true;
                    }

                    const nonEnumType = [
                        'String', 'Integer', 'Long', 'Float', 'Double', 'BigDecimal',
                        'LocalDate', 'Instant', 'ZonedDateTime', 'Boolean', 'byte[]', 'ByteBuffer'
                    ].includes(fieldType);
                    if ((['sql', 'mongodb', 'couchbase'].includes(context.databaseType)) && !nonEnumType) {
                        field.fieldIsEnum = true;
                    } else {
                        field.fieldIsEnum = false;
                    }

                    if (field.fieldIsEnum === true) {
                        context.i18nToLoad.push(field.enumInstance);
                    }

                    if (_.isUndefined(field.fieldNameCapitalized)) {
                        field.fieldNameCapitalized = _.upperFirst(field.fieldName);
                    }

                    if (_.isUndefined(field.fieldNameUnderscored)) {
                        field.fieldNameUnderscored = _.snakeCase(field.fieldName);
                    }

                    if (_.isUndefined(field.fieldNameAsDatabaseColumn)) {
                        const fieldNameUnderscored = _.snakeCase(field.fieldName);
                        const jhiFieldNamePrefix = this.getColumnName(context.jhiPrefix);
                        if (jhiCore.isReservedTableName(fieldNameUnderscored, context.databaseType)) {
                            field.fieldNameAsDatabaseColumn = `${jhiFieldNamePrefix}_${fieldNameUnderscored}`;
                        } else {
                            field.fieldNameAsDatabaseColumn = fieldNameUnderscored;
                        }
                    }

                    if (_.isUndefined(field.fieldNameHumanized)) {
                        field.fieldNameHumanized = _.startCase(field.fieldName);
                    }

                    if (_.isUndefined(field.fieldInJavaBeanMethod)) {
                        // Handle the specific case when the second letter is capitalized
                        // See http://stackoverflow.com/questions/2948083/naming-convention-for-getters-setters-in-java
                        if (field.fieldName.length > 1) {
                            const firstLetter = field.fieldName.charAt(0);
                            const secondLetter = field.fieldName.charAt(1);
                            console.log(secondLetter);
                            if (firstLetter === firstLetter.toLowerCase() && secondLetter === secondLetter.toUpperCase()) {
                                field.fieldInJavaBeanMethod = firstLetter.toLowerCase() + field.fieldName.slice(1);
                            } else {
                                field.fieldInJavaBeanMethod = _.upperFirst(field.fieldName);
                            }
                        } else {
                            field.fieldInJavaBeanMethod = _.upperFirst(field.fieldName);
                        }
                    }

                    if (_.isUndefined(field.fieldValidateRulesPatternJava)) {
                        field.fieldValidateRulesPatternJava = field.fieldValidateRulesPattern ?
                            field.fieldValidateRulesPattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : field.fieldValidateRulesPattern;
                    }

                    if (_.isArray(field.fieldValidateRules) && field.fieldValidateRules.length >= 1) {
                        field.fieldValidate = true;
                    } else {
                        field.fieldValidate = false;
                    }

                    if (fieldType === 'ZonedDateTime') {
                        context.fieldsContainZonedDateTime = true;
                        context.fieldsContainDate = true;
                    } else if (fieldType === 'Instant') {
                        context.fieldsContainInstant = true;
                        context.fieldsContainDate = true;
                    } else if (fieldType === 'LocalDate') {
                        context.fieldsContainLocalDate = true;
                        context.fieldsContainDate = true;
                    } else if (fieldType === 'BigDecimal') {
                        context.fieldsContainBigDecimal = true;
                    } else if (fieldType === 'byte[]' || fieldType === 'ByteBuffer') {
                        context.blobFields.push(field);
                        context.fieldsContainBlob = true;
                        if (field.fieldTypeBlobContent === 'image') {
                            context.fieldsContainImageBlob = true;
                        }
                        if (field.fieldTypeBlobContent !== 'text') {
                            context.fieldsContainBlobOrImage = true;
                        }
                    }

                    if (field.fieldValidate) {
                        context.validation = true;
                    }
                });
                context.hasUserField = context.saveUserSnapshot = false;
                // Load in-memory data for relationships
                context.relationships.forEach((relationship) => {
                    if (_.isUndefined(relationship.relationshipNameCapitalized)) {
                        relationship.relationshipNameCapitalized = _.upperFirst(relationship.relationshipName);
                    }

                    if (_.isUndefined(relationship.relationshipNameCapitalizedPlural)) {
                        if (relationship.relationshipName.length > 1) {
                            relationship.relationshipNameCapitalizedPlural = pluralize(_.upperFirst(relationship.relationshipName));
                        } else {
                            relationship.relationshipNameCapitalizedPlural = _.upperFirst(pluralize(relationship.relationshipName));
                        }
                    }

                    if (_.isUndefined(relationship.relationshipNameHumanized)) {
                        relationship.relationshipNameHumanized = _.startCase(relationship.relationshipName);
                    }

                    if (_.isUndefined(relationship.relationshipNamePlural)) {
                        relationship.relationshipNamePlural = pluralize(relationship.relationshipName);
                    }

                    if (_.isUndefined(relationship.relationshipFieldName)) {
                        relationship.relationshipFieldName = _.lowerFirst(relationship.relationshipName);
                    }

                    if (_.isUndefined(relationship.relationshipFieldNamePlural)) {
                        relationship.relationshipFieldNamePlural = pluralize(_.lowerFirst(relationship.relationshipName));
                    }

                    if (_.isUndefined(relationship.otherEntityRelationshipNamePlural) && (relationship.relationshipType === 'one-to-many' ||
                        (relationship.relationshipType === 'many-to-many' && relationship.ownerSide === false) ||
                        (relationship.relationshipType === 'one-to-one' && relationship.otherEntityName.toLowerCase() !== 'user'))) {
                        relationship.otherEntityRelationshipNamePlural = pluralize(relationship.otherEntityRelationshipName);
                    }

                    if (_.isUndefined(relationship.otherEntityRelationshipNameCapitalized)) {
                        relationship.otherEntityRelationshipNameCapitalized = _.upperFirst(relationship.otherEntityRelationshipName);
                    }

                    if (_.isUndefined(relationship.otherEntityRelationshipNameCapitalizedPlural)) {
                        relationship.otherEntityRelationshipNameCapitalizedPlural = pluralize(_.upperFirst(relationship.otherEntityRelationshipName));
                    }

                    const otherEntityName = relationship.otherEntityName;
                    const otherEntityData = this.getEntityJson(otherEntityName);
                    if (otherEntityData && otherEntityData.microserviceName && !otherEntityData.clientRootFolder) {
                        otherEntityData.clientRootFolder = otherEntityData.microserviceName;
                    }
                    const jhiTablePrefix = context.jhiTablePrefix;

                    if (context.dto && context.dto === 'mapstruct') {
                        if (otherEntityData && (!otherEntityData.dto || otherEntityData.dto !== 'mapstruct')) {
                            this.warning(chalk.red(`This entity has the DTO option, and it has a relationship with entity "${otherEntityName}" that doesn't have the DTO option. This will result in an error.`));
                        }
                    }

                    if (otherEntityName === 'user') {
                        relationship.otherEntityTableName = `${jhiTablePrefix}_user`;
                        context.hasUserField = true;
                    } else {
                        relationship.otherEntityTableName = otherEntityData ? otherEntityData.entityTableName : null;
                        if (!relationship.otherEntityTableName) {
                            relationship.otherEntityTableName = this.getTableName(otherEntityName);
                        }
                        if (jhiCore.isReservedTableName(relationship.otherEntityTableName, context.prodDatabaseType)) {
                            const otherEntityTableName = relationship.otherEntityTableName;
                            relationship.otherEntityTableName = `${jhiTablePrefix}_${otherEntityTableName}`;
                        }
                    }
                    context.saveUserSnapshot = context.applicationType === 'microservice' && context.authenticationType === 'oauth2' && context.hasUserField;

                    if (_.isUndefined(relationship.otherEntityNamePlural)) {
                        relationship.otherEntityNamePlural = pluralize(relationship.otherEntityName);
                    }

                    if (_.isUndefined(relationship.otherEntityNameCapitalized)) {
                        relationship.otherEntityNameCapitalized = _.upperFirst(relationship.otherEntityName);
                    }

                    if (_.isUndefined(relationship.otherEntityRelationshipNamePlural)) {
                        if (relationship.relationshipType === 'many-to-one') {
                            if (otherEntityData && otherEntityData.relationships) {
                                otherEntityData.relationships.forEach((otherRelationship) => {
                                    if (_.upperFirst(otherRelationship.otherEntityName) === entityName &&
                                        otherRelationship.otherEntityRelationshipName === relationship.relationshipName &&
                                        otherRelationship.relationshipType === 'one-to-many') {
                                        relationship.otherEntityRelationshipName = otherRelationship.relationshipName;
                                        relationship.otherEntityRelationshipNamePlural = pluralize(otherRelationship.relationshipName);
                                    }
                                });
                            }
                        }
                    }

                    if (_.isUndefined(relationship.otherEntityAngularName)) {
                        if (relationship.otherEntityNameCapitalized !== 'User') {
                            const otherEntityAngularSuffix = otherEntityData ? otherEntityData.angularJSSuffix || '' : '';
                            // relationship.otherEntityAngularName = _.upperFirst(relationship.otherEntityName) + this.upperFirstCamelCase(otherEntityAngularSuffix);
                        } else {
                            relationship.otherEntityAngularName = 'User';
                        }
                    }

                    if (_.isUndefined(relationship.otherEntityNameCapitalizedPlural)) {
                        relationship.otherEntityNameCapitalizedPlural = pluralize(_.upperFirst(relationship.otherEntityName));
                    }

                    if (_.isUndefined(relationship.otherEntityFieldCapitalized)) {
                        relationship.otherEntityFieldCapitalized = _.upperFirst(relationship.otherEntityField);
                    }

                    if (_.isUndefined(relationship.otherEntityStateName)) {
                        relationship.otherEntityStateName = _.kebabCase(relationship.otherEntityAngularName);
                    }
                    if (_.isUndefined(relationship.otherEntityModuleName)) {
                        if (relationship.otherEntityNameCapitalized !== 'User') {
                            relationship.otherEntityModuleName = `${context.angularXAppName + relationship.otherEntityNameCapitalized}Module`;
                            relationship.otherEntityFileName = _.kebabCase(relationship.otherEntityAngularName);
                            if (context.skipUiGrouping || otherEntityData === undefined) {
                                relationship.otherEntityClientRootFolder = '';
                            } else {
                                relationship.otherEntityClientRootFolder = otherEntityData.clientRootFolder;
                            }
                            if (otherEntityData !== undefined && otherEntityData.clientRootFolder) {
                                if (context.clientRootFolder === otherEntityData.clientRootFolder) {
                                    relationship.otherEntityModulePath = relationship.otherEntityFileName;
                                } else {
                                    relationship.otherEntityModulePath = `${context.entityParentPathAddition ? `${context.entityParentPathAddition}/` : ''}${otherEntityData.clientRootFolder}/${relationship.otherEntityFileName}`;
                                }
                                relationship.otherEntityModelName = `${otherEntityData.clientRootFolder}/${relationship.otherEntityFileName}`;
                                relationship.otherEntityPath = `${otherEntityData.clientRootFolder}/${relationship.otherEntityFileName}`;
                            } else {
                                relationship.otherEntityModulePath = `${context.entityParentPathAddition ? `${context.entityParentPathAddition}/` : ''}${relationship.otherEntityFileName}`;
                                relationship.otherEntityModelName = relationship.otherEntityFileName;
                                relationship.otherEntityPath = relationship.otherEntityFileName;
                            }
                        } else {
                            relationship.otherEntityModuleName = `${context.angularXAppName}SharedModule`;
                            relationship.otherEntityModulePath = 'app/core';
                        }
                    }
                    // Load in-memory data for root
                    if (relationship.relationshipType === 'many-to-many' && relationship.ownerSide) {
                        context.fieldsContainOwnerManyToMany = true;
                    } else if (relationship.relationshipType === 'one-to-one' && !relationship.ownerSide) {
                        context.fieldsContainNoOwnerOneToOne = true;
                    } else if (relationship.relationshipType === 'one-to-one' && relationship.ownerSide) {
                        context.fieldsContainOwnerOneToOne = true;
                    } else if (relationship.relationshipType === 'one-to-many') {
                        context.fieldsContainOneToMany = true;
                    } else if (relationship.relationshipType === 'many-to-one') {
                        context.fieldsContainManyToOne = true;
                    }

                    if (relationship.relationshipValidateRules && relationship.relationshipValidateRules.includes('required')) {
                        relationship.relationshipValidate = relationship.relationshipRequired = context.validation = true;
                    }

                    const entityType = relationship.otherEntityNameCapitalized;
                    if (!context.differentTypes.includes(entityType)) {
                        context.differentTypes.push(entityType);
                    }
                    if (!context.differentRelationships[entityType]) {
                        context.differentRelationships[entityType] = [];
                    }
                    context.differentRelationships[entityType].push(relationship);
                });

                context.pkType = this.getPkType(context.databaseType);

                utils.copyObjectProps(this, this.context);

        // read config from .yo-rc.json
        this.baseName = this.jhipsterAppConfig.baseName;
        this.packageName = this.jhipsterAppConfig.packageName;
        this.packageFolder = this.jhipsterAppConfig.packageFolder;
        this.clientFramework = this.jhipsterAppConfig.clientFramework;
        this.clientPackageManager = this.jhipsterAppConfig.clientPackageManager;
        this.buildTool = this.jhipsterAppConfig.buildTool;

        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

        // variable from questions
        this.message = this.props.message;

        // show all variables
        this.log('\n--- some config read from config ---');
        this.log(`baseName=${this.baseName}`);
        this.log(`packageName=${this.packageName}`);
        this.log(`clientFramework=${this.clientFramework}`);
        this.log(`clientPackageManager=${this.clientPackageManager}`);
        this.log(`buildTool=${this.buildTool}`);

        this.log('\n--- some function ---');
        this.log(`angularAppName=${this.angularAppName}`);

        this.log('\n--- some const ---');
        this.log(`javaDir=${javaDir}`);
        this.log(`resourceDir=${resourceDir}`);
        this.log(`webappDir=${webappDir}`);

        this.log('\n--- variables from questions ---');
        this.log(`\nmessage=${this.message}`);
        this.log('------\n');

        console.log(this);

        if (this.skipServer) return;

            // write server side files
            this.writeFilesToDisk(serverFiles, this, false);

            if (this.databaseType === 'sql') {
                if (this.fieldsContainOwnerManyToMany || this.fieldsContainOwnerOneToOne || this.fieldsContainManyToOne) {
                    this.addConstraintsChangelogToLiquibase(`${this.changelogDate}_added_entity_constraints_${this.entityClass}`);
                }
                this.addChangelogToLiquibase(`${this.changelogDate}_added_entity_${this.entityClass}`);

                if (['ehcache', 'infinispan'].includes(this.cacheProvider) && this.enableHibernateCache) {
                    this.addEntityToCache(this.entityClass, this.relationships, this.packageName, this.packageFolder, this.cacheProvider);
                }
            }
            this.fields.forEach((field) => {
                if (field.fieldIsEnum === true) {
                    const fieldType = field.fieldType;
                    const enumInfo = utils.buildEnumInfo(field, this.angularAppName, this.packageName, this.clientRootFolder);
                    if (!this.skipServer) {
                        this.template(
                            `${SERVER_MAIN_SRC_DIR}package/domain/enumeration/Enum.java.ejs`,
                            `${SERVER_MAIN_SRC_DIR}${this.packageFolder}/domain/enumeration/${fieldType}.java`,
                            this, {}, enumInfo
                        );
                    }
                }
            });
    }

    install() {
        let logMsg =
            `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        if (this.clientFramework === 'angular1') {
            logMsg =
                `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
        }
        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.warning('Install of dependencies failed!');
                this.log(logMsg);
            } else if (this.clientFramework === 'angular1') {
                this.spawnCommand('gulp', ['install']);
            }
        };
        const installConfig = {
            bower: this.clientFramework === 'angular1',
            npm: this.clientPackageManager !== 'yarn',
            yarn: this.clientPackageManager === 'yarn',
            callback: injectDependenciesAndConstants
        };
        if (this.options['skip-install']) {
            this.log(logMsg);
        } else {
            this.installDependencies(installConfig);
        }
    }

    end() {
        this.log('End of feign-client generator');
    }
};

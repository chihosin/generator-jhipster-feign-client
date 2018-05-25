const chalk = require('chalk');
const _ = require('lodash');
const jhiCore = require('jhipster-core');
const pluralize = require('pluralize');
const utils = require('generator-jhipster/generators/utils');
const constants = require('generator-jhipster/generators/generator-constants');

const SERVER_MAIN_SRC_DIR = constants.SERVER_MAIN_SRC_DIR;

const writeEntityFeignClient = (_this, files) => {
    const context = _this.context;
    const entityName = context.name;
    const entityNamePluralizedAndSpinalCased = _.kebabCase(pluralize(entityName));

    context.entityNameCapitalized = context.name;
    context.microserviceName = utils.classify(context.fileData.microserviceName);
    context.entityClass = context.entityNameCapitalized;
    context.entityClassHumanized = _.startCase(context.entityNameCapitalized);
    context.entityClassPlural = pluralize(context.entityClass);
    context.entityClassPluralHumanized = _.startCase(context.entityClassPlural);
    context.entityInstance = _.lowerFirst(entityName);
    context.entityInstancePlural = pluralize(context.entityInstance);
    context.entityApiUrl = entityNamePluralizedAndSpinalCased;
    context.entityFileName = _.kebabCase(context.entityNameCapitalized +
            _.upperFirst(context.entityAngularJSSuffix));
    context.entityFolderName = _this.getEntityFolderName(
        context.clientRootFolder,
        context.entityFileName
    );
    context.entityModelFileName = context.entityFolderName;
    context.entityParentPathAddition = _this.getEntityParentPathAddition(context.clientRootFolder);
    context.entityPluralFileName =
        entityNamePluralizedAndSpinalCased + context.entityAngularJSSuffix;
    context.entityServiceFileName = context.entityFileName;
    context.entityAngularName =
        context.entityClass +
        _this.upperFirstCamelCase(context.entityAngularJSSuffix);
    context.entityReactName =
        context.entityClass +
        _this.upperFirstCamelCase(context.entityAngularJSSuffix);
    context.entityStateName = _.kebabCase(context.entityAngularName);
    context.entityUrl = context.entityStateName;
    context.entityTranslationKey = context.clientRootFolder
        ? _.camelCase(`${context.clientRootFolder}-${context.entityInstance}`)
        : context.entityInstance;
    context.entityTranslationKeyMenu = _.camelCase(context.clientRootFolder
        ? `${context.clientRootFolder}-${context.entityStateName}`
        : context.entityStateName);
    context.jhiTablePrefix = _this.getTableName(context.jhiPrefix);
    context.reactiveRepositories =
        context.applicationType === 'reactive' &&
        ['mongodb', 'couchbase'].includes(context.databaseType);

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
    context.i18nKeyPrefix = `${context.angularAppName}.${
        context.entityTranslationKey
    }`;

    // Load in-memory data for fields
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
            'String',
            'Integer',
            'Long',
            'Float',
            'Double',
            'BigDecimal',
            'LocalDate',
            'Instant',
            'ZonedDateTime',
            'Boolean',
            'byte[]',
            'ByteBuffer'
        ].includes(fieldType);
        if (
            ['sql', 'mongodb', 'couchbase'].includes(context.databaseType) &&
            !nonEnumType
        ) {
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
            const jhiFieldNamePrefix = _this.getColumnName(context.jhiPrefix);
            if (
                jhiCore.isReservedTableName(
                    fieldNameUnderscored,
                    context.databaseType
                )
            ) {
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
                if (
                    firstLetter === firstLetter.toLowerCase() &&
                    secondLetter === secondLetter.toUpperCase()
                ) {
                    field.fieldInJavaBeanMethod =
                        firstLetter.toLowerCase() + field.fieldName.slice(1);
                } else {
                    field.fieldInJavaBeanMethod = _.upperFirst(field.fieldName);
                }
            } else {
                field.fieldInJavaBeanMethod = _.upperFirst(field.fieldName);
            }
        }

        if (_.isUndefined(field.fieldValidateRulesPatternJava)) {
            field.fieldValidateRulesPatternJava = field.fieldValidateRulesPattern
                ? field.fieldValidateRulesPattern
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                : field.fieldValidateRulesPattern;
        }

        if (
            _.isArray(field.fieldValidateRules) &&
            field.fieldValidateRules.length >= 1
        ) {
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

        if (
            _.isUndefined(relationship.otherEntityRelationshipNamePlural) &&
            (relationship.relationshipType === 'one-to-many' ||
                (relationship.relationshipType === 'many-to-many' &&
                    relationship.ownerSide === false) ||
                (relationship.relationshipType === 'one-to-one' &&
                    relationship.otherEntityName.toLowerCase() !== 'user'))
        ) {
            relationship.otherEntityRelationshipNamePlural = pluralize(relationship.otherEntityRelationshipName);
        }

        if (
            _.isUndefined(relationship.otherEntityRelationshipNameCapitalized)
        ) {
            relationship.otherEntityRelationshipNameCapitalized = _.upperFirst(relationship.otherEntityRelationshipName);
        }

        if (
            _.isUndefined(relationship.otherEntityRelationshipNameCapitalizedPlural)
        ) {
            relationship.otherEntityRelationshipNameCapitalizedPlural = pluralize(_.upperFirst(relationship.otherEntityRelationshipName));
        }

        const otherEntityName = relationship.otherEntityName;
        const otherEntityData = _this.getEntityJson(otherEntityName);
        if (
            otherEntityData &&
            otherEntityData.microserviceName &&
            !otherEntityData.clientRootFolder
        ) {
            otherEntityData.clientRootFolder = otherEntityData.microserviceName;
        }
        const jhiTablePrefix = context.jhiTablePrefix;

        if (context.dto && context.dto === 'mapstruct') {
            if (
                otherEntityData &&
                (!otherEntityData.dto || otherEntityData.dto !== 'mapstruct')
            ) {
                _this.warning(chalk.red(`This entity has the DTO option, and it has a relationship with entity "${otherEntityName}" that doesn't have the DTO option. This will result in an error.`));
            }
        }

        if (otherEntityName === 'user') {
            relationship.otherEntityTableName = `${jhiTablePrefix}_user`;
            context.hasUserField = true;
        } else {
            relationship.otherEntityTableName = otherEntityData
                ? otherEntityData.entityTableName
                : null;
            if (!relationship.otherEntityTableName) {
                relationship.otherEntityTableName = _this.getTableName(otherEntityName);
            }
            if (
                jhiCore.isReservedTableName(
                    relationship.otherEntityTableName,
                    context.prodDatabaseType
                )
            ) {
                const otherEntityTableName = relationship.otherEntityTableName;
                relationship.otherEntityTableName = `${jhiTablePrefix}_${otherEntityTableName}`;
            }
        }
        context.saveUserSnapshot =
            context.applicationType === 'microservice' &&
            context.authenticationType === 'oauth2' &&
            context.hasUserField;

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
                        if (
                            _.upperFirst(otherRelationship.otherEntityName) ===
                                entityName &&
                            otherRelationship.otherEntityRelationshipName ===
                                relationship.relationshipName &&
                            otherRelationship.relationshipType === 'one-to-many'
                        ) {
                            relationship.otherEntityRelationshipName =
                                otherRelationship.relationshipName;
                            relationship.otherEntityRelationshipNamePlural = pluralize(otherRelationship.relationshipName);
                        }
                    });
                }
            }
        }

        if (_.isUndefined(relationship.otherEntityAngularName)) {
            if (relationship.otherEntityNameCapitalized !== 'User') {
                const otherEntityAngularSuffix = otherEntityData
                    ? otherEntityData.angularJSSuffix || ''
                    : '';
                relationship.otherEntityAngularName =
                    _.upperFirst(relationship.otherEntityName) +
                    _this.upperFirstCamelCase(otherEntityAngularSuffix);
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
                relationship.otherEntityModuleName = `${context.angularXAppName +
                    relationship.otherEntityNameCapitalized}Module`;
                relationship.otherEntityFileName = _.kebabCase(relationship.otherEntityAngularName);
                if (context.skipUiGrouping || otherEntityData === undefined) {
                    relationship.otherEntityClientRootFolder = '';
                } else {
                    relationship.otherEntityClientRootFolder =
                        otherEntityData.clientRootFolder;
                }
                if (
                    otherEntityData !== undefined &&
                    otherEntityData.clientRootFolder
                ) {
                    if (
                        context.clientRootFolder ===
                        otherEntityData.clientRootFolder
                    ) {
                        relationship.otherEntityModulePath =
                            relationship.otherEntityFileName;
                    } else {
                        relationship.otherEntityModulePath = `${
                            context.entityParentPathAddition
                                ? `${context.entityParentPathAddition}/`
                                : ''
                        }${otherEntityData.clientRootFolder}/${
                            relationship.otherEntityFileName
                        }`;
                    }
                    relationship.otherEntityModelName = `${
                        otherEntityData.clientRootFolder
                    }/${relationship.otherEntityFileName}`;
                    relationship.otherEntityPath = `${
                        otherEntityData.clientRootFolder
                    }/${relationship.otherEntityFileName}`;
                } else {
                    relationship.otherEntityModulePath = `${
                        context.entityParentPathAddition
                            ? `${context.entityParentPathAddition}/`
                            : ''
                    }${relationship.otherEntityFileName}`;
                    relationship.otherEntityModelName =
                        relationship.otherEntityFileName;
                    relationship.otherEntityPath =
                        relationship.otherEntityFileName;
                }
            } else {
                relationship.otherEntityModuleName = `${
                    context.angularXAppName
                }SharedModule`;
                relationship.otherEntityModulePath = 'app/core';
            }
        }
        // Load in-memory data for root
        if (
            relationship.relationshipType === 'many-to-many' &&
            relationship.ownerSide
        ) {
            context.fieldsContainOwnerManyToMany = true;
        } else if (
            relationship.relationshipType === 'one-to-one' &&
            !relationship.ownerSide
        ) {
            context.fieldsContainNoOwnerOneToOne = true;
        } else if (
            relationship.relationshipType === 'one-to-one' &&
            relationship.ownerSide
        ) {
            context.fieldsContainOwnerOneToOne = true;
        } else if (relationship.relationshipType === 'one-to-many') {
            context.fieldsContainOneToMany = true;
        } else if (relationship.relationshipType === 'many-to-one') {
            context.fieldsContainManyToOne = true;
        }

        if (
            relationship.relationshipValidateRules &&
            relationship.relationshipValidateRules.includes('required')
        ) {
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

    context.pkType = _this.getPkType(context.databaseType);

    utils.copyObjectProps(_this, context);

    // write server side files
    _this.writeFilesToDisk(files, _this, false);

    // write server side enum file
    _this.fields.forEach((field) => {
        if (field.fieldIsEnum === true) {
            const fieldType = field.fieldType;
            const enumInfo = utils.buildEnumInfo(
                field,
                _this.angularAppName,
                _this.packageName,
                _this.clientRootFolder
            );
            _this.template(
                `${SERVER_MAIN_SRC_DIR}package/web/rest/dto/enumeration/Enum.java.ejs`,
                `${SERVER_MAIN_SRC_DIR}${
                    _this.packageFolder
                }/web/rest/dto/enumeration/${fieldType}.java`,
                _this,
                {},
                enumInfo
            );
        }
    });
};

const writeUaaFeignClient = (_this, files) => {
    _this.uaaBaseName = _this.jhipsterAppConfig.uaaBaseName;
    _this.uaaClassifyBaseName = utils.classify(_this.uaaBaseName);
    // write server side files
    _this.writeFilesToDisk(files, _this, false);
};

module.exports = {
    writeEntityFeignClient,
    writeUaaFeignClient
};

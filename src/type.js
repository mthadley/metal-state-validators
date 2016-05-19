'use strict';

import { core } from 'metal';

const validators = {
	any: () => true,
	array: primitiveTypeValidatorFactory('array'),
	bool: primitiveTypeValidatorFactory('boolean'),
	func: primitiveTypeValidatorFactory('function'),
	number: primitiveTypeValidatorFactory('number'),
	object: primitiveTypeValidatorFactory('object'),
	string: primitiveTypeValidatorFactory('string'),

	arrayOf: arrayOfValidatorFactory,
	instanceOf: instanceOfValidatorFactory,
	objectOf: objectOfValidatorFactory,
	oneOfType: oneOfTypeValidatorFactory,
	shapeOf: shapeOfValidatorFactory
};

/**
 * Creates a validator that checks the values of an array against a type.
 * @param {!function} validator Type validator to check each index against.
 * @return {function} Validator.
 */
function arrayOfValidatorFactory(validator) {
	return (value, name, context) => {
		if (!Array.isArray(value)) {
			return composeError('Expected an array.', name, context);
		} else {
			const testArray = value.every(
				item => {
					return !(validator(item, name) instanceof Error);
				}
			);

			if (!testArray) {
				return composeError('Expected an array of single type', name, context);
			}
		}

		return true;
	};
}

/**
 * Composes a warning a warning message.
 * @param {!string} error Error message to display to console.
 * @param {string} name Name of state property that is giving the error.
 * @param {object} context.
 * @return {Error}
 */
function composeError(error, name, context) {
	const componentName = context ? core.getFunctionName(context) : null;
	const parentComponent = context && context.getRenderer ? context.getRenderer().lastParentComponent_ : null;
	const parentComponentName = parentComponent ? core.getFunctionName(parentComponent) : null;

	const location = parentComponentName ? `Check render method of '${parentComponentName}'.` : '';

	return new Error(`Warning: Invalid state passed to '${name}'. ${error} Passed to '${componentName}'. ${location}`);
}

/**
 * Checks type of given value.
 * @param value Any value.
 * @return {string} Type of value.
 */
function getStateType(value) {
	const stateType = typeof value;
	if (Array.isArray(value)) {
		return 'array';
	}

	return stateType;
}

/**
 * Creates a validator that compares a value to a specific class.
 * @param {!function} expectedClass Class to check value against.
 * @return {function} Validator.
 */
function instanceOfValidatorFactory(expectedClass) {
	return (value, name, context) => {
		if (!(value instanceof expectedClass)) {
			return composeError(`Expected instance of ${expectedClass}`, name, context);
		}

		return true;
	};
}

/**
 * Creates a validator that checks the values of an object against a type.
 * @param {!function} typeValidator Validator to check value against.
 * @return {function} Validator.
 */
function objectOfValidatorFactory(typeValidator) {
	return (value, name, context) => {
		let success = true;

		for (let key in value) {
			success = !(typeValidator(value[key], null) instanceof Error);
		}

		if (!success) {
			return composeError('Expected object of one type', name, context);
		}

		return true;
	};
}

/**
 * Creates a validator that checks a value against multiple types and only has to pass one.
 * @param {!array} arrayOfTypeValidators Array of validators to check value against.
 * @return {function} Validator.
 */
function oneOfTypeValidatorFactory(arrayOfTypeValidators) {
	if (!Array.isArray(arrayOfTypeValidators)) {
		return (value, name, context) => composeError('Expected an array.', name, context);
	}

	return (value, name, context) => {
		for (let i = 0; i < arrayOfTypeValidators.length; i++) {
			const validator = arrayOfTypeValidators[i];

			if (!(validator(value, name) instanceof Error)) {
				return true;
			}
		}

		return composeError('Expected one of given types.', name, context);
	};
}

/**
 * Creates a validator that checks against a specific primitive type.
 * @param {!string} expectedType Type to check against.
 * @return {function} Validator.
 */
function primitiveTypeValidatorFactory(expectedType) {
	return (value, name, context) => {
		const type = getStateType(value);

		if (type !== expectedType) {
			return composeError(`Expected type '${expectedType}'`, name, context);
		}

		return true;
	};
}

/**
 * Creates a validator that checks the shape of an object.
 * @param {!object} shape An object containing type validators for each key.
 * @return {function} Validator.
 */
function shapeOfValidatorFactory(shape) {
	if (getStateType(shape) !== 'object') {
		return (value, name, context) => composeError(`Expected an object`, name, context);
	}

	return (value, name, context) => {
		for (let key in shape) {
			const validator = shape[key];
			const valueForKey = value[key];

			if (validator(valueForKey, null) instanceof Error) {
				return composeError('Expected object with a specific shape', name, context);
			}
		}

		return true;
	};
}

export default validators;
import { AggregateRoot, Identifier } from "src/Shared";
import { DomainObjectError } from "src/Shared";
import {
	Username,
	UserNameDomainError,
} from "src/User/Domain/ValueObject/Username";
import {
	EmailAddress,
	EmailAddressError,
} from "src/User/Domain/ValueObject/EmailAddress";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import { Err, Ok, Result, hasError } from "result-ts-type";

interface IUserProps {
	username: Username;
	emailAddress: EmailAddress;
}

/**
 * This class is the user class.
 */
export class User extends AggregateRoot<string, IUserProps> {
	private constructor(id: UserId, props: IUserProps) {
		super(id, props);
	}

	static create(id: UserId, props: IUserProps): User {
		return new User(id, props);
	}

	get name(): Username {
		return this.props.username;
	}

	get emailAddress(): EmailAddress {
		return this.props.emailAddress;
	}

	/**
	 * change user's name.
	 * @param username
	 * @return User
	 */
	public changeUsername(username: Username): User {
		return new User(this.id, {
			...this.props,
			username,
		});
	}

	/**
	 * create a user from primitive values.
	 * @param id
	 * @param username
	 * @param emailAddress
	 */
	static createFromPrimitives(
		id: string,
		username: string,
		emailAddress: string,
	): Result<
		User,
		| UserIdDomainError
		| UserDomainError
		| EmailAddressError
		| UserNameDomainError
	> {
		const userIdOrErr = UserId.create(id);
		const emailOrErr = EmailAddress.create(emailAddress);
		const usernameOrErr = Username.create(username);

		const errorResult = hasError([userIdOrErr, emailOrErr, usernameOrErr]);

		if (errorResult.err) {
			return Err(errorResult.error);
		}

		const userId = userIdOrErr.unwrap();
		const email = emailOrErr.unwrap();
		const name = usernameOrErr.unwrap();

		return Ok(
			this.create(userId, {
				emailAddress: email,
				username: name,
			}),
		);
	}
}

/**
 * This class is the user's ID.
 */
export class UserId extends Identifier<string> {
	private constructor(id: string) {
		super(id);
	}

	/**
	 * User id is UUID.
	 * @param id
	 */
	static create(id: string): Result<UserId, UserIdDomainError> {
		if (!uuidValidate(id)) {
			return Err(new UserIdDomainError("Incorrect User ID pattern"));
		}

		return Ok(new UserId(id));
	}

	/**
	 * generate a new user ID.
	 * The ID is generated by the uuid library.
	 * @link https://github.com/uuidjs/uuid
	 */
	static generate(): UserId {
		const uuid = uuidv4();
		return new UserId(uuid);
	}
}

export class UserIdDomainError extends DomainObjectError {}
export class UserDomainError extends UserIdDomainError {}

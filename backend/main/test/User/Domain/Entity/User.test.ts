import { describe, expect, it, test } from "vitest";
import { User, UserId } from "../../../../src/User";
import {
	UserDomainError,
	UserIdDomainError,
} from "../../../../src/User/Domain/Entity/User";
import { Username } from "../../../../src/User/Domain/ValueObject/Username";

describe("User ID", () => {
	it("correct ID", () => {
		const correctId = "aaaaaaaa-1111-1111-1111-111111111111";
		const userId = UserId.create(correctId);
		expect(userId.ok).toBeTruthy();
		expect(userId.value.id).toBe(correctId);
	});

	it("No Hyphen", () => {
		const noHyphen = "aaaaaaaa111111111111111111111111";
		expect(UserId.create(noHyphen).ok).toBeFalsy();
	});

	it("Less Length", () => {
		const lessLength = "aaaaaaaa-1111-1111-1111-11111111111";
		expect(UserId.create(lessLength).ok).toBeFalsy();
	});

	it("Too Long", () => {
		const tooLong = "aaaaaaaa-1111-1111-1111-1111111111111";
		expect(UserId.create(tooLong).ok).toBeFalsy();
	});
});

describe("User Object", () => {
	const id = "11111111-1111-1111-1111-111111111111";
	const userId: UserId = UserId.create(id).value!;
	const username: Username = Username.create("dummy user name");

	describe("creating user", () => {
		it("success", () => {
			const user = User.create(userId, {
				username,
			});

			expect(user.name).toMatchObject(username);
		});
	});

	describe("change username", () => {
		const user = User.create(userId, { username });

		it("change user name", () => {
			const changeTo = Username.create("changedUserName").value;
			const changedNameUser = user.changeUsername(changeTo);
			expect(changedNameUser.name).toBe(changeTo);
		});
	});
});
import { Hono } from "hono";
import {
	honoInternalServerErrorAdapter,
	honoNotImplementedAdapter,
	honoOkResponseAdapter,
	honoResponseAdapter,
} from "src/Shared/Adapters/HonoAdapter";
import { UserRepository } from "src/User/Repositories/UserRepository";
import { UpdateUserNameUseCase } from "src/User/UseCases/UpdateUserUseCase/UpdateUserNameUseCase";
import { UpdateUserNameController } from "src/User/Controllers/UpdateUserNameUseCaseController";
import { getUserService } from "src/Services/GetUserIdService/GetUserService";
import { FindUserQuery } from "src/User/Query/FindUser/FindUserQuery";
import { NishikiDynamoDBClient } from "src/Shared/Adapters/DB/NishikiTableClient";
import { FindUserController } from "src/User/Controllers/FindUserController";

const userRepository = new UserRepository();
const nishikiDynamoDBClient = new NishikiDynamoDBClient();

/**
 * This is a User router.
 * https://genesis-tech-tribe.github.io/nishiki-documents/web-api/index.html#tag/user
 * @param app
 */
export const userRouter = (app: Hono) => {
	app.post("/users", async (c) => {
		return honoNotImplementedAdapter(c);
	});

	// get user by id.
	app.get("/users/:id", async (c) => {
		const id = c.req.param("id");
		const query = new FindUserQuery(nishikiDynamoDBClient);
		const controller = new FindUserController(query);
		const result = await controller.execute(id);

		if (result.status !== "OK") {
			return honoResponseAdapter(c, result);
		}

		// when the user is not found, return the result.
		// `!result.body` means the user is not found.
		if (!result.body) {
			return honoResponseAdapter(c, result);
		}

		// if array is returned, it is an unexpected behavior.
		if (Array.isArray(result.body)) {
			console.error("[Router Error]: Not found in the /users/:id.");
			console.error("[Router Error]: Array are returned.");
			return honoInternalServerErrorAdapter(c, "Internal Server Error");
		}

		// remove the email address from data, when the user is found.
		return honoOkResponseAdapter(c, {
			id: result.body.userId,
			name: result.body.username,
		});
	});

	// update user name.
	app.put("/users/:id", async (c) => {
		// TODO: must be updated after the implementation of this service.
		const requestingUserId = await getUserService.getUserId("credential"); // get form credential (header)
		const targetUserId = c.req.param("id"); // get from path param
		const body = await c.req.json();
		const name = body.name;
		const useCase = new UpdateUserNameUseCase(userRepository);
		const controller = new UpdateUserNameController(useCase);
		const result = await controller.execute({
			name,
			targetUserId,
			userId: requestingUserId,
		});
		return honoResponseAdapter(c, result);
	});
};

/**
 * This is an Auth router.
 * https://genesis-tech-tribe.github.io/nishiki-documents/web-api/index.html#tag/auth
 * @param app
 */
export const authRouter = (app: Hono) => {
	app.get("/auth/me", async (c) => {
		return honoNotImplementedAdapter(c);
	});
};

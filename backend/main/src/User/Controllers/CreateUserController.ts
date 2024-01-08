import { Controller } from "src/Shared";
import { CreateUserUseCase } from "src/User/UseCases/CreateUserUseCase/CreateUserUseCase";
import { IUserDto } from "src/User/Dtos/UserDto";

interface ICreateUserInput {
	name?: string;
	emailAddress: string;
}

export class CreateUserController extends Controller<
	ICreateUserInput,
	IUserDto
> {
	readonly useCase: CreateUserUseCase;

	constructor(useCase: CreateUserUseCase) {
		super();
		this.useCase = useCase;
	}
	protected async handler(input: ICreateUserInput) {
		const { name, emailAddress } = input;

		const result = await this.useCase.execute({ name, emailAddress });

		if (!result.ok) {
			return this.badRequest(result.error.message);
		}

		return this.created(result.value);
	}
}

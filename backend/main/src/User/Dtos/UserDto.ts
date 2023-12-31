import { User } from "src/User/Domain/Entity/User";

export interface IUserDto {
	id: string;
	name: string;
}

export const userDtoMapper = (user: User): IUserDto => {
	return {
		id: user.id.id,
		name: user.name.name,
	};
};

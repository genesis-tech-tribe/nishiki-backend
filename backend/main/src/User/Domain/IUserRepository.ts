import { User, UserId } from "src/User/Domain/Entity/User";

export interface IUserRepository {
	find(id: UserId[]): Promise<User[]>;
	find(id: UserId): Promise<User | null>;
	create(user: User): Promise<undefined>;
	update(user: User): Promise<undefined>;
	delete(id: UserId): Promise<undefined>;
}

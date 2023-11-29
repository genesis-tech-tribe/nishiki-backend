import { Container } from "src/Group/Domain/Entities/Container";
import { IFoodDto } from "./FoodDto";

export interface IContainerDto {
	id: string;
	name: string;
	foods: IFoodDto[];
}

export const containerDtoMapper = (container: Container): IContainerDto => {
	return {
		id: container.id.id,
		name: container.name,
		foods: container.foods as IFoodDto[],
	};
};

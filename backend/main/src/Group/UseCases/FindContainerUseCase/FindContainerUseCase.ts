import { IContainerRepository } from "src/Group/Domain/IContainerRepository";
import { Container, ContainerId } from "src/Group/Domain/Entities/Container";
import { IUseCase } from "src/Shared";
import { Err, Ok, Result } from "result-ts-type";
import {
	FindContainerUseCaseErrorType,
	GroupIsNotExisting,
	IFindContainerUseCase,
	UserIsNotAuthorized,
} from "src/Group/UseCases/FindContainerUseCase/IFindContainerUseCase";
import { IContainerDto, containerDtoMapper } from "src/Group/Dtos/ContainerDto";
import { IGroupRepository } from "src/Group/Domain/IGroupRepository";
import { UserId } from "src/User";

/**
 * Find a container.
 */
export class FindContainerUseCase
	implements
		IUseCase<
			IFindContainerUseCase,
			IContainerDto | null,
			FindContainerUseCaseErrorType
		>
{
	private readonly containerRepository: IContainerRepository;
	private readonly groupRepository: IGroupRepository;

	constructor(
		containerRepository: IContainerRepository,
		groupRepository: IGroupRepository,
	) {
		this.containerRepository = containerRepository;
		this.groupRepository = groupRepository;
	}

	public async execute(
		request: IFindContainerUseCase,
	): Promise<Result<IContainerDto | null, FindContainerUseCaseErrorType>> {
		const containerIdOrError = ContainerId.create(request.containerId);
		if (!containerIdOrError.ok) {
			return Err(containerIdOrError.error);
		}
		const containerId = containerIdOrError.value;

		// check the user is the member of the group
		const group = await this.groupRepository.find(containerId);
		if (!group) {
			return Ok(null);
		}
		const userIdOrError = UserId.create(request.userId);
		if (!userIdOrError.ok) {
			return Err(userIdOrError.error);
		}
		const userId = userIdOrError.value;
		const canEdit = group.canEdit(userId);

		if (!canEdit) {
			return Err(
				new UserIsNotAuthorized(
					"The user is not authorized to a ccess the container.",
				),
			);
		}

		const container = await this.containerRepository.find(containerId);

		return Ok(container ? containerDtoMapper(container) : null);
	}
}
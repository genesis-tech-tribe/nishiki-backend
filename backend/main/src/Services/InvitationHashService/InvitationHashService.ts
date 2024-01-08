import { NishikiDynamoDBClient } from "src/Shared/Adapters/DB/NishikiTableClient";
import { Err, Ok, Result } from "result-ts-type";
import { IGroupRepository } from "src/Group/Domain/IGroupRepository";
import { GroupId } from "src/Group/Domain/Entities/Group";
import { UserId } from "src/User";
import Md5 from "crypto-js/md5";
import { DomainObjectError, ServiceError } from "src/Shared/Utils/Errors";
import { isValidUUIDV4 } from "src/Shared/Utils/Validator";

interface IHash {
	hash: string;
	expiryDatetime: Date;
}

export class InvitationHashService {
	private nishikiDynamoDBClient: NishikiDynamoDBClient;
	private groupRepository: IGroupRepository;

	constructor(
		nishikiDynamoDBClient: NishikiDynamoDBClient,
		groupRepository: IGroupRepository,
	) {
		this.nishikiDynamoDBClient = nishikiDynamoDBClient;
		this.groupRepository = groupRepository;
	}

	/**
	 * This method generate an invitation hash.
	 * Before generating an invitation hash, this method check existence of the invitation hash.
	 * If the invitation hash does exist, this method checks the expiry datetime.
	 * If the expiry datetime is over, this method generate a new invitation hash.
	 * If not over, this method returns the invitation hash with updating the expiry datetime.
	 * The invitation hash link is generated by a string of "groupId + expiry Datetime" using MD5.
	 * https://genesis-tech-tribe.github.io/nishiki-documents/project-document/specifications/detail/invitation-to-group#invitation-link-specification
	 * @param input
	 */
	async generateAnInvitationHash(input: {
		groupId: string;
		userId: string;
	}): Promise<
		Result<IHash, DomainObjectError | GroupNotFound | PermissionError>
	> {
		const groupIdOrError = GroupId.create(input.groupId);
		const userIdOrError = UserId.create(input.userId);

		if (groupIdOrError.err || userIdOrError.err) {
			if (groupIdOrError.err) {
				return Err(groupIdOrError.error);
			}
			return Err(userIdOrError.unwrapError());
		}

		const { groupId, userId } = {
			groupId: groupIdOrError.value,
			userId: userIdOrError.value,
		};

		const group = await this.groupRepository.find(groupId);

		if (!group) {
			return Err(new GroupNotFound("Group not found"));
		}

		if (!group.canEdit(userId)) {
			return Err(
				new PermissionError("You don't have permission to access this group."),
			);
		}

		const invitationHash = await this.nishikiDynamoDBClient.getInvitationLink(
			groupId.id,
		);

		const now = new Date(Date.now());
		const expiryDatetime = new Date(Date.now());
		expiryDatetime.setHours(expiryDatetime.getHours() + 24); // 24 hours.

		const hash = Md5(`${groupId.id}${expiryDatetime}`).toString();

		// invitation link doesn't exist.
		if (!invitationHash) {
			await this.nishikiDynamoDBClient.addInvitationLink(
				groupId.id,
				expiryDatetime,
				hash,
			);
			return Ok({
				hash,
				expiryDatetime,
			});
		}

		// invitation link doesn't expire.
		if (now < invitationHash.linkExpiryTime) {
			await this.nishikiDynamoDBClient.addInvitationLink(
				groupId.id,
				expiryDatetime,
				invitationHash.invitationLinkHash,
			);
			return Ok({
				hash: invitationHash.invitationLinkHash,
				expiryDatetime,
			});
		}

		// invitation link expires, remove it, and generate a new one.
		await Promise.all([
			this.nishikiDynamoDBClient.addInvitationLink(
				groupId.id,
				expiryDatetime,
				hash,
			),
			this.nishikiDynamoDBClient.deleteInvitationLink(invitationHash),
		]);
		return Ok({
			hash,
			expiryDatetime,
		});
	}

	/**
	 * This method join a user to the group using an invitation hash.
	 * This method checks the existence of the invitation hash and the user.
	 * If the invitation hash and the user exists, this method adds the user to the group.
	 * And return the groupId of the group.
	 * If the invitation link is  expired, this method returns an error.
	 * @param hash - The hash string of the invitation link hash.
	 * @param userId - The userId of the user who will be joined the group.
	 */
	async joinToGroupUsingAnInvitationHash(
		hash: string,
		userId: string,
	): Promise<
		Result<{ groupId: string }, UserIdError | UserNotFound | HashNotFound>
	> {
		if (!isValidUUIDV4(userId)) {
			return Err(new UserIdError("UserId is not valid."));
		}

		const [invitationLinkHash, userData] = await Promise.all([
			this.nishikiDynamoDBClient.getInvitationLink(hash),
			this.nishikiDynamoDBClient.getUser({ userId }),
		]);

		if (!userData) {
			return Err(new UserNotFound("Requesting user is not found."));
		}

		if (!invitationLinkHash) {
			return Err(new HashNotFound("Invalid hash is requested."));
		}

        if (invitationLinkHash.linkExpiryTime < new Date()) {
            return Err(new InvitationLinkExpired("The requested invitation link is expired."));
        }

		// add a user to the group
		await this.nishikiDynamoDBClient.saveGroup(invitationLinkHash.groupId, {
			userIds: [userId],
		});

		return Ok({ groupId: invitationLinkHash.groupId });
	}
}

export class GroupNotFound extends ServiceError {}
export class PermissionError extends ServiceError {}
export class UserIdError extends ServiceError {}
export class UserNotFound extends ServiceError {}
export class HashNotFound extends ServiceError {}
export class InvitationLinkExpired extends ServiceError {}

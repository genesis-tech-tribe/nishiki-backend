import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { resourceName, Stage } from "../utils";

/**
 * If the stage is not prod, add "-dev" to the every asset's name.
 */
interface IProps extends StackProps {
	readonly stage: Stage;
}

export class NishikiStaticAssetsStack extends Stack {
	public readonly nishikiTable: Table;

	constructor(scope: Construct, id: string, props: IProps) {
		super(scope, id, props);

		const { stage } = props;

		const nishikiTable = new Table(this, "NishikiTable", {
			tableName: resourceName("NishikiTable", stage),
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: {
				name: "PK",
				type: AttributeType.STRING,
			},
			sortKey: {
				name: "SK",
				type: AttributeType.STRING,
			},
		});
	}
}

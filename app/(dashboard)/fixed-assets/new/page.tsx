import { requireRole } from "@/lib/require-role";
import { createFixedAsset } from "@/app/(dashboard)/fixed-assets/actions";
import { FixedAssetForm } from "@/components/fixed-assets/fixed-asset-form";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";


export default async function NewFixedAssetPage() {
    await requireRole(["ADMIN"]);

    return (
        <div className="space-y-6 px-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">New Fixed Asset</CardTitle>

                    <p className="pt-1 text-sm text-muted-foreground">
                        This fixed asset is recorded in the system for tracking and
                        depreciation purposes.
                    </p>
                </CardHeader>
            </Card>


            <FixedAssetForm action={createFixedAsset} submitLabel="Add Asset" />
        </div>
    );
}
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAccount extends Document {
    userId: mongoose.Types.ObjectId; // Reference to User
    provider: string;
    providerAccountId: string;
    type: string;
    access_token?: string | null;
    expires_at?: number | null;
    token_type?: string | null;
    scope?: string | null;
    id_token?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        provider: { type: String, required: true },
        providerAccountId: { type: String, required: true },
        type: { type: String, required: true },
        access_token: { type: String, default: null },
        expires_at: { type: Number, default: null },
        token_type: { type: String, default: null },
        scope: { type: String, default: null },
        id_token: { type: String, default: null },
    },
    { timestamps: true }
);

AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

export const AccountModel: Model<IAccount> =
    (mongoose.models && mongoose.models.Account) || mongoose.model<IAccount>("Account", AccountSchema);

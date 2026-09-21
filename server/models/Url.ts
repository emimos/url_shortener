import mongoose, { Schema, Document } from 'mongoose';

export interface IUrl extends Document {
  shortCode: string;
  originalUrl: string;
  title?: string;
  customAlias?: string;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date | null;
  tags: string[];
  isActive: boolean;
  qrCode?: string;
}

export const UrlSchema: Schema = new Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    customAlias: {
      type: String,
      trim: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    qrCode: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose model definition
export const UrlModel = mongoose.models.Url || mongoose.model<IUrl>('Url', UrlSchema);

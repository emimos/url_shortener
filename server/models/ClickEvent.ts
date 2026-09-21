import mongoose, { Schema, Document } from 'mongoose';

export interface IClickEvent extends Document {
  shortCode: string;
  timestamp: Date;
  ip: string;
  referrer: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  country?: string;
}

export const ClickEventSchema: Schema = new Schema(
  {
    shortCode: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: {
      type: String,
      default: 'Unknown',
    },
    referrer: {
      type: String,
      default: 'Direct',
    },
    userAgent: {
      type: String,
      default: '',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    os: {
      type: String,
      default: 'Unknown',
    },
    device: {
      type: String,
      default: 'Desktop',
    },
    country: {
      type: String,
      default: 'Unknown',
    },
  },
  {
    timestamps: false,
  }
);

export const ClickEventModel =
  mongoose.models.ClickEvent || mongoose.model<IClickEvent>('ClickEvent', ClickEventSchema);

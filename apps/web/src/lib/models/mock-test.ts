import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const MOCK_TEST_SKILLS = ["reading", "listening", "writing", "speaking"] as const;
export const MOCK_TEST_STATUSES = ["draft", "published", "archived"] as const;

export type MockTestSkill = (typeof MOCK_TEST_SKILLS)[number];
export type MockTestStatus = (typeof MOCK_TEST_STATUSES)[number];

const testQuestionSchema = new Schema(
  {
    qid: { type: String, trim: true },
    type: { type: String, trim: true },
    prompt: { type: String, trim: true },
    options: { type: [String], default: [] },
    correctOption: { type: Number, default: -1 },
    multiple: { type: Boolean, default: false },
    correctOptions: { type: [Number], default: [] },
    answer: { type: String, trim: true },
    passageRef: { type: String, trim: true },
    wordHint: { type: String, trim: true },
  },
  { _id: false }
);

const testSectionSchema = new Schema(
  {
    id: { type: String, trim: true },
    passageId: { type: String, trim: true },
    type: { type: String, trim: true },
    instructions: { type: String, trim: true },
    passage: { type: String },
    image: { type: String, trim: true },
    imagePlacement: { type: String, trim: true },
    questions: { type: [testQuestionSchema], default: [] },
  },
  { _id: false }
);

const testPassageSchema = new Schema(
  {
    id: { type: String, trim: true },
    title: { type: String, trim: true },
    text: { type: String },
  },
  { _id: false }
);

const mockTestContentSchema = new Schema(
  {
    type: { type: String, enum: [...MOCK_TEST_SKILLS], default: "reading" },
    passage: { type: String },
    passages: { type: [testPassageSchema], default: [] },
    audioUrl: { type: String, trim: true },
    audioPublicId: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    sections: { type: [testSectionSchema], default: [] },
    writingTask1: { type: String },
    writingTask2: { type: String },
    writingTask1Image: { type: String, trim: true },
    writingTask1ImagePlacement: { type: String, trim: true },
    writingTask2Image: { type: String, trim: true },
    writingTask2ImagePlacement: { type: String, trim: true },
  },
  { _id: false }
);

const mockTestSchema = new Schema(
  {
    bundle: { type: Schema.Types.ObjectId, ref: "MockTestBundle", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    title: { type: String, required: true, trim: true },
    skill: {
      type: String,
      enum: MOCK_TEST_SKILLS,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: MOCK_TEST_STATUSES,
      default: "draft",
      index: true,
    },
    durationMinutes: { type: Number, min: 0, default: 0 },
    questionCount: { type: Number, min: 0, default: 0 },
    order: { type: Number, min: 0, default: 0 },
    content: { type: mockTestContentSchema },
    answerKey: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

mockTestSchema.index({ bundle: 1, skill: 1, order: 1 });

export type MockTestQuestionDoc = InferSchemaType<typeof testQuestionSchema>;
export type MockTestSectionDoc = InferSchemaType<typeof testSectionSchema>;
export type MockTestPassageDoc = InferSchemaType<typeof testPassageSchema>;
export type MockTestContentDoc = InferSchemaType<typeof mockTestContentSchema>;

export type MockTestDoc = InferSchemaType<typeof mockTestSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const MockTest =
  (mongoose.models.MockTest as mongoose.Model<MockTestDoc>) ??
  mongoose.model<MockTestDoc>("MockTest", mockTestSchema);
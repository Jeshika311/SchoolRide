import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'closed'],
    default: 'open'
  }
}, { timestamps: true });

export default mongoose.models.supportTicket || mongoose.model('supportTicket', supportTicketSchema);
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');

// Download ticket as PDF
router.get('/:registrationId/pdf', auth, async (req, res) => {
  try {
    const reg = await Registration.findOne({
      _id: req.params.registrationId,
      user: req.user._id
    }).populate('event');

    if (!reg) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const doc = new PDFDocument({ size: [595, 280], margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${reg.ticketId}.pdf"`);
    doc.pipe(res);

    // Background
    doc.rect(0, 0, 595, 280).fill('#0f0f23');

    // Gold accent bar
    doc.rect(0, 0, 6, 280).fill('#c9a84c');

    // Left section
    doc.rect(6, 0, 360, 280).fill('#1a1a35');

    // Header
    doc.fillColor('#c9a84c').font('Helvetica-Bold').fontSize(22)
      .text('EVORAX', 30, 25);
    doc.fillColor('#8888aa').font('Helvetica').fontSize(9)
      .text('EvoraX National School — EVENT TICKET', 30, 52);

    // Divider
    doc.moveTo(30, 68).lineTo(340, 68).strokeColor('#c9a84c').lineWidth(0.5).stroke();

    // Event title (English only - removed Sinhala)
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16)
      .text(reg.event.title || '', 30, 80, { width: 310 });

    // Event details
    const eventDate = new Date(reg.event.date);
    const dateStr = eventDate.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.fillColor('#8888aa').font('Helvetica').fontSize(9).text('DATE', 30, 130);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(dateStr, 30, 143);

    doc.fillColor('#8888aa').font('Helvetica').fontSize(9).text('TIME', 30, 163);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(reg.event.time || '', 30, 176);

    doc.fillColor('#8888aa').font('Helvetica').fontSize(9).text('VENUE', 160, 130);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(reg.event.venue || '', 160, 143, { width: 170 });

    doc.fillColor('#8888aa').font('Helvetica').fontSize(9).text('TICKET TYPE', 160, 163);
    doc.fillColor('#c9a84c').font('Helvetica-Bold').fontSize(11).text((reg.ticketType || 'GENERAL').toUpperCase(), 160, 176);

    // Attendee section
    doc.moveTo(30, 202).lineTo(340, 202).strokeColor('#333355').lineWidth(0.5).stroke();

    doc.fillColor('#8888aa').font('Helvetica').fontSize(9).text('ATTENDEE', 30, 212);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12).text(reg.attendeeName, 30, 225);
    doc.fillColor('#8888aa').font('Helvetica').fontSize(9).text(reg.attendeeEmail, 30, 242);

    // Ticket ID
    doc.fillColor('#c9a84c').font('Helvetica-Bold').fontSize(13).text(reg.ticketId, 30, 258);

    // Perforated divider
    doc.moveTo(366, 10).lineTo(366, 270).strokeColor('#333355').lineWidth(1).dash(4, { space: 4 }).stroke();
    doc.undash();

    // Right section (stub)
    doc.rect(367, 0, 228, 280).fill('#0f0f23');

    // QR Code section
    if (reg.qrCode) {
      const qrBase64 = reg.qrCode.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      doc.image(qrBuffer, 397, 30, { width: 168, height: 168 });
    }

    doc.fillColor('#8888aa').font('Helvetica').fontSize(8)
      .text('SCAN AT ENTRY', 430, 208, { width: 100, align: 'center' });

    doc.fillColor('#555577').font('Helvetica').fontSize(7)
      .text('This ticket is valid for one-time entry only', 377, 232, { width: 210, align: 'center' });

    doc.fillColor('#333355').font('Helvetica').fontSize(7)
      .text('evorax.lk', 430, 248, { width: 100, align: 'center' });

    // Category badge
    const cat = (reg.event.category || 'event').toUpperCase();
    doc.roundedRect(377, 258, 75, 14, 3).fill('#c9a84c');
    doc.fillColor('#0f0f23').font('Helvetica-Bold').fontSize(8).text(cat, 377, 261, { width: 75, align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate ticket' });
  }
});

// Download participation certificate as PDF (ALL SINHALA REMOVED)
router.get('/:registrationId/certificate', auth, async (req, res) => {
  try {
    const reg = await Registration.findOne({
      _id: req.params.registrationId,
      user: req.user._id
    }).populate('event');

    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${reg.ticketId}.pdf"`);
    doc.pipe(res);

    const W = 841.89, H = 595.28;

    // Background layers
    doc.rect(0, 0, W, H).fill('#faf8f0');

    // Outer border
    doc.rect(20, 20, W - 40, H - 40).strokeColor('#c9a84c').lineWidth(2).stroke();
    doc.rect(28, 28, W - 56, H - 56).strokeColor('#c9a84c').lineWidth(0.5).stroke();

    // Corner decorations
    const corners = [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]];
    corners.forEach(([x, y]) => {
      doc.circle(x, y, 6).fill('#c9a84c');
    });

    // Top header band
    doc.rect(28, 28, W - 56, 80).fill('#1a1a35');

    // School name in header (English only)
    doc.fillColor('#c9a84c').font('Helvetica-Bold').fontSize(28)
      .text('EVORAX NATIONAL SCHOOL', 0, 45, { width: W, align: 'center' });
    doc.fillColor('#8888cc').font('Helvetica').fontSize(13)
      .text('EvoraX National School — Colombo, Sri Lanka', 0, 75, { width: W, align: 'center' });

    // Certificate title
    doc.fillColor('#1a1a35').font('Helvetica-Bold').fontSize(38)
      .text('CERTIFICATE OF PARTICIPATION', 0, 128, { width: W, align: 'center' });

    // Decorative line
    doc.moveTo(180, 175).lineTo(W - 180, 175).strokeColor('#c9a84c').lineWidth(1.5).stroke();

    // Body text
    doc.fillColor('#444444').font('Helvetica').fontSize(16)
      .text('This is to certify that', 0, 195, { width: W, align: 'center' });

    // Recipient name
    doc.fillColor('#1a1a35').font('Helvetica-Bold').fontSize(34)
      .text(reg.attendeeName, 0, 225, { width: W, align: 'center' });

    // Underline
    const nameWidth = doc.widthOfString(reg.attendeeName) * 1.05;
    const nameX = (W - nameWidth) / 2;
    doc.moveTo(nameX, 268).lineTo(nameX + nameWidth, 268).strokeColor('#c9a84c').lineWidth(1).stroke();

    doc.fillColor('#444444').font('Helvetica').fontSize(15)
      .text('has successfully participated in', 0, 280, { width: W, align: 'center' });

    // Event name (English only - removed Sinhala)
    const eventDate = new Date(reg.event.date);
    const dateStr = eventDate.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.fillColor('#c9a84c').font('Helvetica-Bold').fontSize(22)
      .text(reg.event.title, 0, 308, { width: W, align: 'center' });

    doc.fillColor('#555555').font('Helvetica').fontSize(13)
      .text(`held on ${dateStr} at ${reg.event.venue}`, 0, 358, { width: W, align: 'center' });

    // Bottom section
    doc.moveTo(180, 400).lineTo(W - 180, 400).strokeColor('#c9a84c').lineWidth(0.5).stroke();

    // Signatures
    doc.fillColor('#1a1a35').font('Helvetica-Bold').fontSize(11);
    doc.text('_______________________', 140, 420);
    doc.text('_______________________', W / 2 - 60, 420);
    doc.text('_______________________', W - 310, 420);

    doc.fillColor('#555555').font('Helvetica').fontSize(10);
    doc.text('Principal', 160, 442, { width: 130, align: 'center' });
    doc.text('Event Coordinator', W / 2 - 60, 442, { width: 140, align: 'center' });
    doc.text('School Secretary', W - 310, 442, { width: 130, align: 'center' });

    // Date and certificate number
    doc.fillColor('#888888').font('Helvetica').fontSize(9)
      .text(`Issued: ${new Date().toLocaleDateString('en-LK')}  |  Certificate No: ${reg.ticketId}  |  evorax.lk`, 0, 465, { width: W, align: 'center' });

    // Bottom band
    doc.rect(28, H - 60, W - 56, 32).fill('#1a1a35');
    doc.fillColor('#c9a84c').font('Helvetica').fontSize(9)
      .text('This certificate is issued by EvoraX National School, Colombo, Sri Lanka.  |  EvoraX National School', 0, H - 48, { width: W, align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate certificate' });
  }
});

// Get ticket data (for viewing)
router.get('/:registrationId', auth, async (req, res) => {
  try {
    const reg = await Registration.findOne({
      _id: req.params.registrationId,
      user: req.user._id
    }).populate('event', 'title titleSinhala date time venue category image');

    if (!reg) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, registration: reg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
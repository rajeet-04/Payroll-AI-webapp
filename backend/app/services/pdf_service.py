"""
PDF generation service for payslips
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import datetime
from typing import Dict
import json
import os
import logging
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


class PDFService:
    """Service for generating payslip PDFs"""
    
    @staticmethod
    def generate_payslip_pdf(
        employee_data: Dict,
        payslip_data: Dict,
        company_name: str = "Company Name"
    ) -> bytes:
        """
        Generate a PDF payslip
        
        Args:
            employee_data: Employee information (name, designation, etc.)
            payslip_data: Payslip data including pay_data_snapshot, gross_pay, etc.
            company_name: Company name for header
            
        Returns:
            PDF as bytes
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)

        # Container for PDF elements
        elements = []

        # Styles
        styles = getSampleStyleSheet()

        # Try to register a Unicode-capable font from common system locations so the rupee sign (₹)
        # will render. If none is available we fall back to built-in fonts and use 'INR' instead.
        def _register_system_font():
            candidates = [
                ("DejaVuSans.ttf", "DejaVuSans-Bold.ttf"),
                ("NotoSans-Regular.ttf", "NotoSans-Bold.ttf"),
                ("segoeui.ttf", "segoeuib.ttf"),
                ("arialuni.ttf", "arialbd.ttf"),
                ("arial.ttf", "arialbd.ttf"),
                ("FreeSans.ttf", "FreeSansBold.ttf"),
                ("Ubuntu-R.ttf", "Ubuntu-B.ttf"),
            ]

            search_paths = [
                r"C:\\Windows\\Fonts",
                "/usr/share/fonts/truetype",
                "/usr/local/share/fonts",
                "/usr/share/fonts",
                "/Library/Fonts",
                os.path.join(os.path.expanduser("~"), ".fonts"),
            ]

            for base in search_paths:
                for reg_name, bold_name in candidates:
                    reg_path = os.path.join(base, reg_name)
                    bold_path = os.path.join(base, bold_name)
                    if os.path.exists(reg_path):
                        try:
                            reg_font_name = f"CustomReg_{os.path.basename(reg_path)}"
                            pdfmetrics.registerFont(TTFont(reg_font_name, reg_path))
                            if os.path.exists(bold_path):
                                bold_font_name = f"CustomBold_{os.path.basename(bold_path)}"
                                try:
                                    pdfmetrics.registerFont(TTFont(bold_font_name, bold_path))
                                except Exception:
                                    bold_font_name = reg_font_name
                            else:
                                bold_font_name = reg_font_name
                            logging.info(f"Registered font {reg_path} (bold={bold_path if os.path.exists(bold_path) else 'none'})")
                            return reg_font_name, bold_font_name
                        except Exception as reg_exc:
                            logging.debug(f"Failed to register {reg_path}: {reg_exc}")

            logging.warning("No suitable TTF font found. Falling back to built-in fonts; rupee glyph may not render.")
            return "Helvetica", "Helvetica-Bold"

        font_regular, font_bold = _register_system_font()

        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontName=font_bold,
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            alignment=TA_CENTER,
            spaceAfter=12
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontName=font_bold,
            fontSize=14,
            textColor=colors.HexColor('#333333'),
            spaceAfter=6
        )

        normal_style = styles['Normal']
        normal_style.fontName = font_regular

        # Parse pay data snapshot
        pay_data = payslip_data.get('pay_data_snapshot', {})
        if isinstance(pay_data, str):
            pay_data = json.loads(pay_data)

        # Helpers
        def _format_currency(amount: float) -> str:
            try:
                if font_regular in ("Helvetica", "Times-Roman", "Courier"):
                    return f"INR {amount:,.2f}"
                return f"₹ {amount:,.2f}"
            except Exception:
                return f"INR {amount:,.2f}"

        # Header
        elements.append(Paragraph(company_name, title_style))
        elements.append(Paragraph("PAYSLIP", heading_style))
        elements.append(Spacer(1, 0.2*inch))

        # Employee & Period Info
        elements.append(Paragraph("Employee Details", heading_style))
        info_data = [
            ['Employee Name:', employee_data.get('full_name', 'N/A'), 'Pay Period:', 'Monthly'],
            ['Employee ID:', employee_data.get('employee_id', 'N/A')[:8], 'Generated On:', datetime.now().strftime('%d-%b-%Y')],
            ['Designation:', employee_data.get('designation', 'N/A'), 'Payment Date:', datetime.now().strftime('%d-%b-%Y')],
        ]

        info_table = Table(info_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), font_bold),
            ('FONTNAME', (2, 0), (2, -1), font_bold),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.3*inch))

        # Earnings Section
        elements.append(Paragraph("EARNINGS", heading_style))
        base_pay = float(pay_data.get('base_pay', 0))
        allowances = pay_data.get('allowances', {}) or {}
        gross_pay = float(payslip_data.get('gross_pay', 0))

        earnings_data = [['Description', 'Amount']]
        earnings_data.append(['Basic Salary', _format_currency(base_pay)])
        for key, value in allowances.items():
            label = key.upper().replace('_', ' ')
            earnings_data.append([label, _format_currency(float(value))])
        earnings_data.append(['GROSS PAY', _format_currency(gross_pay)])

        earnings_table = Table(earnings_data, colWidths=[4*inch, 2.5*inch])
        earnings_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), font_bold),
            ('FONTNAME', (0, -1), (-1, -1), font_bold),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e2e8f0')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(earnings_table)
        elements.append(Spacer(1, 0.3*inch))

        # Deductions Section
        elements.append(Paragraph("DEDUCTIONS", heading_style))
        deductions_fixed = pay_data.get('deductions_fixed', {}) or {}
        deductions_percent = pay_data.get('deductions_percent', {}) or {}
        leave_deduction = float(pay_data.get('leave_deduction', 0) or 0)
        tax_deduction = float(pay_data.get('tax_deduction', 0) or 0)
        unpaid_leave_days = pay_data.get('unpaid_leave_days', 0) or 0

        deductions_data = [['Description', 'Amount']]
        for key, value in deductions_fixed.items():
            label = key.upper().replace('_', ' ')
            deductions_data.append([label, _format_currency(float(value))])
        for key, value in deductions_percent.items():
            label = f"{key.upper().replace('_', ' ')} ({value}%)"
            amount = gross_pay * (float(value) / 100)
            deductions_data.append([label, _format_currency(amount)])
        if leave_deduction > 0:
            deductions_data.append([f'Unpaid Leave ({unpaid_leave_days} days)', _format_currency(leave_deduction)])
        deductions_data.append(['Tax (10%)', _format_currency(tax_deduction)])
        total_deductions = float(payslip_data.get('total_deductions', 0) or 0)
        deductions_data.append(['TOTAL DEDUCTIONS', _format_currency(total_deductions)])

        deductions_table = Table(deductions_data, colWidths=[4*inch, 2.5*inch])
        deductions_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), font_bold),
            ('FONTNAME', (0, -1), (-1, -1), font_bold),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fee2e2')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(deductions_table)
        elements.append(Spacer(1, 0.3*inch))

        # Net Pay Section
        net_pay = float(payslip_data.get('net_pay', 0) or 0)
        net_pay_data = [['NET PAY', _format_currency(net_pay)]]
        net_pay_table = Table(net_pay_data, colWidths=[4*inch, 2.5*inch])
        net_pay_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), font_bold),
            ('FONTSIZE', (0, 0), (-1, -1), 14),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#059669')),
        ]))
        elements.append(net_pay_table)
        elements.append(Spacer(1, 0.5*inch))

        # Footer
        footer_text = "This is a computer-generated payslip and does not require a signature."
        elements.append(Paragraph(footer_text, ParagraphStyle(
            'Footer',
            parent=normal_style,
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )))

        # Build PDF
        doc.build(elements)

        # Get PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes


# Create singleton instance
pdf_service = PDFService()

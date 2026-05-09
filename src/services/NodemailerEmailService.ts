import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';
import { AppLogger } from '@/core/logging/logger';
import { config } from '@/core/config';

export interface EmailData {
    fromName?: string;
    to: string | string[];
    from?: string;
    subject: string;
    html?: string;
    text?: string;
}

export interface TemplatedEmailData extends Omit<EmailData, 'html' | 'text'> {
    templateData?: Record<string, any>;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    to: string | string[];
    error?: string;
}

export class NodemailerEmailService {
    private transporter: nodemailer.Transporter;
    private templatePath: string;
    private defaultFrom: string;
    private defaultFromName: string;

    constructor() {
        const smtp = config.email.smtp;
        this.transporter = nodemailer.createTransport({
            service: smtp.service,
            auth: {
                user: smtp.user,
                pass: smtp.pass,
            },
        });

        this.templatePath = config.email.templatePath || path.resolve(process.cwd(), 'email-templates');
        this.defaultFrom = config.email.defaultFromEmail || smtp.user || '';
        this.defaultFromName = config.email.defaultFromName || 'Moon Textile';
    }

    async sendEmail(emailData: EmailData): Promise<EmailResult> {
        try {
            const info = await this.transporter.sendMail({
                from: emailData.from || `"${emailData.fromName || this.defaultFromName}" <${this.defaultFrom}>`,
                to: emailData.to,
                subject: emailData.subject,
                text: emailData.text,
                html: emailData.html,
            });

            AppLogger.info(`Email sent: ${info.messageId}`);
            return { success: true, messageId: info.messageId, to: emailData.to };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            AppLogger.error(`Error sending email: ${errorMessage}`);
            return { success: false, to: emailData.to, error: errorMessage };
        }
    }

    async sendTemplatedEmail(templateName: string, emailData: TemplatedEmailData): Promise<EmailResult> {
        try {
            const template = await this.loadTemplate(templateName);
            const html = this.compileTemplate(template, emailData.templateData || {});

            return await this.sendEmail({
                ...emailData,
                html,
                text: this.htmlToText(html),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            AppLogger.error(`Error sending templated email: ${errorMessage}`);
            return { success: false, to: emailData.to, error: errorMessage };
        }
    }

    private async loadTemplate(templateName: string): Promise<string> {
        const fullPath = path.join(this.templatePath, `${templateName}.html`);
        return await fs.readFile(fullPath, 'utf8');
    }

    private compileTemplate(template: string, data: Record<string, any>): string {
        let compiled = template;
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            compiled = compiled.replace(regex, String(data[key] || ''));
        });
        return compiled;
    }

    private htmlToText(html: string): string {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
    }
}

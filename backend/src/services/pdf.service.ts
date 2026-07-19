import PDFDocument from 'pdfkit';

interface ContractPdfClient {
  name: string;
  cpfCnpj: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

interface ContractPdfData {
  title: string;
  description?: string | null;
  value: number;
  startDate: Date;
  endDate?: Date | null;
  terms?: string | null;
  client: ContractPdfClient;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (date: Date) => new Date(date).toLocaleDateString('pt-BR');

/**
 * Gera o PDF de um contrato a partir dos dados do contrato + cliente.
 */
export function generateContractPdf(data: ContractPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).font('Helvetica-Bold').text(data.title.toUpperCase(), { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(11).font('Helvetica-Bold').text('CONTRATANTE:');
    doc.font('Helvetica').text(
      `${data.client.name}, CPF/CNPJ nº ${data.client.cpfCnpj}` +
        (data.client.address ? `, residente/sediado(a) em ${data.client.address}` : '') +
        (data.client.city ? `, ${data.client.city}${data.client.state ? '/' + data.client.state : ''}` : '') +
        '.',
      { align: 'justify' }
    );
    doc.moveDown();

    if (data.description) {
      doc.font('Helvetica-Bold').text('OBJETO:');
      doc.font('Helvetica').text(data.description, { align: 'justify' });
      doc.moveDown();
    }

    doc.font('Helvetica-Bold').text('VALOR:');
    doc.font('Helvetica').text(formatCurrency(data.value));
    doc.moveDown();

    doc.font('Helvetica-Bold').text('VIGÊNCIA:');
    doc
      .font('Helvetica')
      .text(
        `Início em ${formatDate(data.startDate)}` +
          (data.endDate ? `, com término em ${formatDate(data.endDate)}.` : ', por prazo indeterminado.')
      );
    doc.moveDown();

    if (data.terms) {
      doc.font('Helvetica-Bold').text('CLÁUSULAS E CONDIÇÕES:');
      doc.font('Helvetica').text(data.terms, { align: 'justify', lineGap: 3 });
      doc.moveDown();
    }

    doc.moveDown(2);
    doc.font('Helvetica').text(`${data.client.city || '_______________'}, ${formatDate(new Date())}.`, {
      align: 'center',
    });

    doc.moveDown(3);
    doc.text('_________________________________', { align: 'center' });
    doc.text('CONTRATANTE', { align: 'center' });
    doc.moveDown(2);
    doc.text('_________________________________', { align: 'center' });
    doc.text('CONTRATADO(A)', { align: 'center' });

    doc.end();
  });
}

/**
 * Gera um PDF simples (título + corpo de texto já com as variáveis substituídas).
 * Usado para procurações, petições e qualquer documento baseado em Template.
 */
export function generateTemplatePdf(title: string, content: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(13).font('Helvetica-Bold').text(title.toUpperCase(), { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(11).font('Helvetica').text(content.trim(), { align: 'justify', lineGap: 4 });

    doc.end();
  });
}

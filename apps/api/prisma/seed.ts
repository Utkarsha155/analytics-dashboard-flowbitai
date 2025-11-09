import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function getCategory(description: string) {
  if (!description) return 'General';
  const desc = description.toLowerCase();
  if (desc.includes('software') || desc.includes('saas') || desc.includes('license')) return 'Software';
  if (desc.includes('consulting') || desc.includes('legal') || desc.includes('hr')) return 'Services';
  if (desc.includes('office') || desc.includes('supplies')) return 'Office Supplies';
  if (desc.includes('cloud') || desc.includes('aws') || desc.includes('gcp')) return 'IT/Cloud';
  return 'General';
}

async function main() {
  console.log('Start seeding with FINAL (lineItems fix) script...');

  const dataPath = path.join(__dirname, '../../../data/Analytics_Test_Data.json');
  
  if (!fs.existsSync(dataPath)) {
    throw new Error(`FATAL: Data file not found at ${dataPath}`);
  }
  
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const allDocuments = JSON.parse(fileContent);

  if (!allDocuments || allDocuments.length === 0) {
    throw new Error('FATAL: Data file is empty.');
  }
  console.log(`Found ${allDocuments.length} documents in JSON file.`);

  await prisma.payment.deleteMany();
  await prisma.lineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.customer.deleteMany();
  console.log('Cleared existing data.');

  let createdCount = 0;
  let skippedCount = 0;

  for (const doc of allDocuments) {
    const data = doc.extractedData?.llmData;

    // --- THIS IS THE FIX (added .value at the end) ---
    const lineItemsArray = data?.lineItems?.value?.items?.value;

    // --- UPDATED CHECK ---
    if (!data || !data.vendor || !data.customer || !data.invoice || !data.summary || !lineItemsArray) {
      console.warn(`Skipping document (missing 'llmData' or 'lineItems'): ${doc._id}`);
      skippedCount++;
      continue;
    }

    try {
      const vendorName = data.vendor.value.vendorName?.value;
      const customerName = data.customer.value.customerName?.value;
      const customerAddress = data.customer.value.customerAddress?.value;
      const invoiceNumber = data.invoice.value.invoiceId?.value;
      const invoiceDate = data.invoice.value.invoiceDate?.value;
      const dueDate = data.payment.value.dueDate?.value || data.invoice.value.invoiceDate?.value;
      const totalAmount = data.summary.value.invoiceTotal?.value;
      const status = doc.status === 'processed' ? 'Pending' : doc.status;

      if (!vendorName || !customerName || !invoiceNumber || !totalAmount) {
        console.warn(`Skipping invoice (missing critical fields): ${invoiceNumber || doc._id}`);
        skippedCount++;
        continue;
      }

      const vendor = await prisma.vendor.upsert({
        where: { name: vendorName },
        update: {},
        create: { name: vendorName },
      });

      const customer = await prisma.customer.upsert({
        where: { name: customerName },
        update: { address: customerAddress },
        create: {
          name: customerName,
          address: customerAddress,
        },
      });

      await prisma.invoice.create({
        data: {
          invoice_number: invoiceNumber,
          date: new Date(invoiceDate),
          due_date: new Date(dueDate),
          amount: totalAmount,
          status: status,
          vendorId: vendor.id,
          customerId: customer.id,
          lineItems: {
            // Now lineItemsArray is the correct array
            create: lineItemsArray.map((item: any) => ({
              description: item.description?.value || 'N/A',
              quantity: item.quantity?.value || 1,
              price: item.unitPrice?.value || item.totalPrice?.value || 0,
              category: getCategory(item.description?.value), 
            })),
          },
        },
      });
      
      createdCount++;

    } catch (error) {
      if (error instanceof Error) {
        console.error(`Failed to process doc ${doc._id}: ${error.message}`);
      } else {
        console.error(`Failed to process doc ${doc._id}: ${String(error)}`);
      }
      skippedCount++;
    }
  }
  
  console.log(`Successfully created ${createdCount} invoices.`);
  console.log(`Skipped ${skippedCount} documents.`);
  console.log('Seeding finished.');
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
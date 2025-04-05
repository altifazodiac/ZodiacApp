// components/ReceiptTemplate.tsx
import { OrderItem, Settings } from "../Data/types"; // ปรับ path ตามโครงสร้างโปรเจกต์ของคุณ

// components/ReceiptTemplate.tsx
interface ReceiptTemplateProps {
    receiptNumber: string;
    queueNumber: number | null; // ปรับเป็น number | null
    orderItems: OrderItem[];
    subtotal: number;
    tax: number;
    serviceCharge: number;
    total: number;
    totalDiscount: number | null; // ปรับเป็น number | null
    selectedPaymentMethod: string[];
    paymentDetails: { [key: string]: number };
    remainbalance: number;
    settings?: Settings | null;
    shopName?: string;
  logoUrl?: string;
  }
  
  export const ReceiptTemplate = ({
    receiptNumber,
    queueNumber,
    orderItems,
    subtotal,
    tax,
    serviceCharge,
    total,
    totalDiscount,
    selectedPaymentMethod,
    paymentDetails,
    remainbalance,
    settings,
    shopName = "ร้านค้า",
    logoUrl,
  }: ReceiptTemplateProps): string => {
    const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  
    const itemsHTML = orderItems
      .map(
        (item) => `
          <tr>
            <td style="text-align: left;">${item.product.nameDisplay}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${(
              item.quantity *
              (parseFloat(item.product.price) +
                item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0))
            ).toFixed(0)}฿</td>
          </tr>
          ${
            item.selectedOptions.length > 0
              ? `<tr><td colspan="3" style="font-size: 12px; color: #666;">ตัวเลือก: ${item.selectedOptions
                  .map((opt) => opt.name)
                  .join(", ")}</td></tr>`
              : ""
          }
          ${
            item.customInput
              ? `<tr><td colspan="3" style="font-size: 12px; color: #666;">หมายเหตุ: ${item.customInput}</td></tr>`
              : ""
          }
        `
      )
      .join("");
  
    const paymentMethodsHTML = selectedPaymentMethod
      .map(
        (method) =>
          `<div style="display: flex; justify-content: space-between;">
            <span>${method}:</span>
            <span>${(paymentDetails[method] || 0).toFixed(0)}฿</span>
          </div>`
      )
      .join("");
  
    return `
      <html>
        <head>
          <style>
            @media print {
              body { 
                font-family: 'Arial', 'Kanit', sans-serif; 
                font-size: 12px; 
                width: 80mm; 
                margin: 0; 
                padding: 5mm; 
              }
              .no-print { display: none; }
            }
            .header { text-align: center; margin-bottom: 10px; }
            .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 3px; }
            .total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header">
                ${logoUrl ? `<img src="${logoUrl}" style="width: 50px; height: 50px;" />` : ""}
                <h2>${shopName}</h2>
              <p>ใบเสร็จ #${receiptNumber}</p>
            <p>คิวที่: #${queueNumber ?? "N/A"}</p> <!-- ใช้ ?? เพื่อจัดการ null -->
            <p>วันที่: ${now}</p>
          </div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">รายการ</th>
                <th style="text-align: center;">จำนวน</th>
                <th style="text-align: right;">ราคา</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          <div class="divider"></div>
          <div>
            <div style="display: flex; justify-content: space-between;">
              <span>ยอดก่อนรวม:</span>
              <span>${subtotal.toFixed(0)}฿</span>
            </div>
            ${
              settings?.OrderPanels.displayTax
                ? `<div style="display: flex; justify-content: space-between;">
                    <span>ภาษี (${(settings.OrderPanels.taxValue * 100).toFixed(
                      0
                    )}%):</span>
                    <span>${tax.toFixed(0)}฿</span>
                  </div>`
                : ""
            }
            ${
              settings?.OrderPanels.displayServiceCharge
                ? `<div style="display: flex; justify-content: space-between;">
                    <span>ค่าบริการ (${(
                      settings.OrderPanels.serviceChargeValue * 100
                    ).toFixed(0)}%):</span>
                    <span>${serviceCharge.toFixed(0)}฿</span>
                  </div>`
                : ""
            }
            ${
              totalDiscount !== null && totalDiscount > 0 // ตรวจสอบ null
                ? `<div style="display: flex; justify-content: space-between;">
                    <span>ส่วนลด:</span>
                    <span>-${totalDiscount.toFixed(0)}฿</span>
                  </div>`
                : ""
            }
            ${paymentMethodsHTML}
            ${
              remainbalance > 0
                ? `<div style="display: flex; justify-content: space-between;">
                    <span>เงินทอน:</span>
                    <span>${remainbalance.toFixed(0)}฿</span>
                  </div>`
                : ""
            }
            <div class="divider"></div>
            <div class="total" style="display: flex; justify-content: space-between;">
              <span>ยอดรวม:</span>
              <span>${total.toFixed(0)}฿</span>
            </div>
          </div>
          <div class="footer">
            <p>ขอบคุณที่ใช้บริการ!</p>
          </div>
        </body>
      </html>
    `;
  };
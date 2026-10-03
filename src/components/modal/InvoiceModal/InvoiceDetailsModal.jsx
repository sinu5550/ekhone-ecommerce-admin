import React from 'react';
import BaseModal from "../BaseModal";
import { CreditCard, Clock, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { getInvoiceNumber } from "@/lib/invoicePDF";

const InvoiceDetailsModal = ({
    isOpen,
    onClose,
    invoice,
    formatDate,
    formatCurrency
}) => {
    if (!isOpen || !invoice) return null;

    const handleClose = () => {
        onClose();
    };

    // Get payment status icon and color
    const getPaymentStatusDetails = (status) => {
        switch (status) {
            case 'Paid':
                return {
                    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    borderColor: 'border-green-200'
                };
            case 'Partial':
                return {
                    icon: <Clock className="w-5 h-5 text-sky-600" />,
                    bgColor: 'bg-sky-100',
                    textColor: 'text-sky-800',
                    borderColor: 'border-sky-200'
                };
            default:
                return {
                    icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-800',
                    borderColor: 'border-yellow-200'
                };
        }
    };

    const paymentStatusDetails = getPaymentStatusDetails(invoice.paymentStatus);

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Invoice Details"
            size="4xl">
            <div className="space-y-6">
                {/* Header Section with Invoice Number, Order Number and Status */}
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Invoice Number</p>
                        <p className="text-2xl font-bold text-gray-900">{getInvoiceNumber(invoice)}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-gray-500" />
                            <p className="text-sm text-gray-600">
                                Order Number: <span className="font-mono font-semibold text-sky-600">{invoice.orderNumber || '—'}</span>
                            </p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Invoice Date: {formatDate(invoice.createdAt)}
                        </p>
                        {invoice.orderDate && (
                            <p className="text-sm text-gray-500">
                                Order Date: {formatDate(invoice.orderDate)}
                            </p>
                        )}
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${paymentStatusDetails.bgColor} ${paymentStatusDetails.textColor} ${paymentStatusDetails.borderColor}`}>
                        {paymentStatusDetails.icon}
                        <p className="">
                            Payment : 
                            <span className="font-semibold"> {invoice.paymentStatus}</span>
                        </p>
                    </div>
                </div>

                {/* Order Status Badge (if available) */}
                {invoice.orderStatus && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Order Status:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${invoice.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                            invoice.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                invoice.orderStatus === 'Processing' ? 'bg-purple-100 text-purple-800' :
                                    invoice.orderStatus === 'Confirmed' ? 'bg-sky-100 text-sky-800' :
                                        'bg-yellow-100 text-yellow-800'
                            }`}>
                            {invoice.orderStatus}
                        </span>
                    </div>
                )}

                {/* Payment Status Banner */}
                <div className={`p-4 rounded-lg border ${paymentStatusDetails.bgColor} ${paymentStatusDetails.borderColor}`}>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <p className="font-semibold">Payment Summary</p>
                            {invoice.paymentStatus === 'Partial' && (
                                <p className="text-sm mt-1">Partial payment received. Remaining balance needs to be paid.</p>
                            )}
                            {invoice.paymentStatus === 'Paid' && (
                                <p className="text-sm mt-1">Full payment received. Invoice is settled.</p>
                            )}
                            {invoice.paymentStatus === 'Unpaid' && (
                                <p className="text-sm mt-1">No payment received yet.</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm">Paid Amount: <span className="font-semibold text-green-600">{formatCurrency(invoice.paidAmount || 0)}</span></p>
                            <p className="text-sm">Due Amount: <span className="font-semibold text-red-600">{formatCurrency(invoice.dueAmount || 0)}</span></p>
                        </div>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                        <div className="space-y-2">
                            <p><span className="text-sm text-gray-600">Name:</span> <span className="font-medium">{invoice.customer?.fullName}</span></p>
                            <p><span className="text-sm text-gray-600">Email:</span> {invoice.customer?.email || '—'}</p>
                            <p><span className="text-sm text-gray-600">Phone:</span> {invoice.customer?.phone || '—'}</p>
                            {invoice.customer?.customerCode && (
                                <p><span className="text-sm text-gray-600">Customer Code:</span> {invoice.customer.customerCode}</p>
                            )}
                        </div>
                    </div>

                    {/* Order Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                        <div className="space-y-2">
                            <p><span className="text-sm text-gray-600">Order Number:</span> <span className="font-mono font-medium">{invoice.orderNumber || '—'}</span></p>
                            {invoice.orderDate && (
                                <p><span className="text-sm text-gray-600">Order Date:</span> {formatDate(invoice.orderDate)}</p>
                            )}
                            {invoice.orderStatus && (
                                <p><span className="text-sm text-gray-600">Order Status:</span> {invoice.orderStatus}</p>
                            )}
                            {invoice.orderPaymentMethod && (
                                <p><span className="text-sm text-gray-600">Payment Method:</span> {invoice.orderPaymentMethod}</p>
                            )}
                            {invoice.orderNote && (
                                <p><span className="text-sm text-gray-600">Order Note:</span> {invoice.orderNote}</p>
                            )}
                        </div>
                    </div>

                    {/* Shipping Address if available */}
                    {invoice.shippingAddress && (
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                            <div className="space-y-1 text-sm">
                                {invoice.shippingAddress.recipientName && (
                                    <p><span className="text-gray-600">Recipient:</span> {invoice.shippingAddress.recipientName}</p>
                                )}
                                <p>{invoice.shippingAddress.address}</p>
                                <p>
                                    {invoice.shippingAddress.upazila && `${invoice.shippingAddress.upazila}, `}
                                    {invoice.shippingAddress.city && `${invoice.shippingAddress.city}, `}
                                    {invoice.shippingAddress.district && `${invoice.shippingAddress.district}`}
                                </p>
                                <p>
                                    {invoice.shippingAddress.division && `${invoice.shippingAddress.division}`}
                                    {invoice.shippingAddress.postalCode && ` - ${invoice.shippingAddress.postalCode}`}
                                </p>
                                <p><span className="text-gray-600">Phone:</span> {invoice.shippingAddress.phoneNumber || invoice.customer?.phone}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Invoice Items */}
                <div>
                    <h3 className="font-semibold mb-3 text-lg">Invoice Items</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-3 text-left">#</th>
                                    <th className="border border-gray-300 p-3 text-left">Product</th>
                                    <th className="border border-gray-300 p-3 text-left">SKU</th>
                                    <th className="border border-gray-300 p-3 text-right">Quantity</th>
                                    <th className="border border-gray-300 p-3 text-right">Unit Price</th>
                                    <th className="border border-gray-300 p-3 text-right">Discount</th>
                                    <th className="border border-gray-300 p-3 text-right">Tax</th>
                                    <th className="border border-gray-300 p-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(invoice.invoiceItems || invoice.orderItems || []).map((item, idx) => {
                                    const productName = item.orderItem?.product?.productName || item.product?.productName || item.product?.name || item.productName || "Product";
                                    const sku = item.orderItem?.product?.sku || item.product?.sku || item.sku || "—";
                                    const qty = item.quantity || 1;
                                    const unitPrice = item.unitPrice ?? item.price ?? 0;
                                    const discount = item.discount ?? 0;
                                    const tax = item.tax ?? 0;
                                    const lineTotal = item.lineTotal ?? (qty * unitPrice - discount + tax);

                                    return (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 p-3 text-center">{idx + 1}</td>
                                            <td className="border border-gray-300 p-3">
                                                <div>
                                                    <div className="font-medium">{productName}</div>
                                                    {(item.color || item.size) && (
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {item.color && <span className="mr-2">Color: {item.color}</span>}
                                                            {item.size && <span>Size: {item.size}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="border border-gray-300 p-3">{sku}</td>
                                            <td className="border border-gray-300 p-3 text-right">{qty}</td>
                                            <td className="border border-gray-300 p-3 text-right">{formatCurrency(unitPrice)}</td>
                                            <td className="border border-gray-300 p-3 text-right text-red-600">{discount > 0 ? `-${formatCurrency(discount)}` : "—"}</td>
                                            <td className="border border-gray-300 p-3 text-right">{tax > 0 ? formatCurrency(tax) : "—"}</td>
                                            <td className="border border-gray-300 p-3 text-right font-semibold">{formatCurrency(lineTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="border-t pt-4">
                    <div className="flex justify-end">
                        <div className="w-80 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span>{formatCurrency(invoice.totalAmount ?? invoice.subTotal ?? 0)}</span>
                            </div>
                            {invoice.discount > 0 && (
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Discount:</span>
                                    <span>-{formatCurrency(invoice.discount)}</span>
                                </div>
                            )}
                            {invoice.voucher_promo > 0 && (
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Voucher/Promo:</span>
                                    <span>-{formatCurrency(invoice.voucher_promo)}</span>
                                </div>
                            )}
                            {invoice.tax > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Tax:</span>
                                    <span>{formatCurrency(invoice.tax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Grand Total:</span>
                                <span>{formatCurrency(invoice.grandTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600 pt-1">
                                <span>Paid Amount:</span>
                                <span className="font-semibold">{formatCurrency(invoice.paidAmount || 0)}</span>
                            </div>
                            {invoice.dueAmount > 0 && (
                                <div className="flex justify-between text-sm text-red-600 font-semibold">
                                    <span>Due Amount:</span>
                                    <span>{formatCurrency(invoice.dueAmount)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                {invoice.payments && invoice.payments.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Payment History ({invoice.payments.length})
                        </h3>
                        <div className="space-y-2">
                            {invoice.payments.map((payment, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center hover:bg-gray-100 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium text-sm">{payment.paymentNumber}</p>
                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                {payment.paymentMethod}
                                            </span>
                                            {payment.paymentMethod === 'COD' && (
                                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                                    Cash on Delivery
                                                </span>
                                            )}
                                            {payment.onlinePaymentMethod && (
                                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                    {payment.onlinePaymentMethod}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDate(payment.paymentDate)}
                                        </p>
                                        {payment.referenceNumber && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Reference: {payment.referenceNumber}
                                            </p>
                                        )}
                                        {payment.paymentNotes && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Note: {payment.paymentNotes}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-green-600">
                                            {formatCurrency(payment.paymentAmount)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Remarks */}
                {invoice.remarks && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold mb-2 text-yellow-800">Remarks</h4>
                        <p className="text-gray-700">{invoice.remarks}</p>
                    </div>
                )}
            </div>
        </BaseModal>
    );
};

export default InvoiceDetailsModal;
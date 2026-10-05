const SingleProductFields = ({ register, errors, watch }) => {

    const taxType = watch("taxType");
    const isTaxInclusive = taxType === "exclusive";

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label className="block text-sm font-medium">Quantity <span className="text-rose-500">*</span> </label>
                <input
                    {...register("quantity", {
                        required: "Quantity is required",
                        valueAsNumber: true,
                        min: {
                            value: 0,
                            message: "Quantity cannot be negative"
                        },
                        validate: (value) => {
                            if (value < 0) return "Quantity must be 0 or greater";
                            return true;
                        }
                    })}
                    type="number"
                    min="0"
                    placeholder="Enter Quantity"
                    className="pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                />
                {errors.quantity && (
                    <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium">Selling Price <span className="text-rose-500">*</span></label>
                <input
                    {...register("price", {
                        required: "Price is required",
                        valueAsNumber: true
                    })}
                    type="number"
                    step="0.01"
                    placeholder="Enter Selling Price"
                    className="pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                />
                {errors.price && (
                    <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium">Unit Cost (Buying Price)</label>
                <input
                    {...register("costPrice", {
                        valueAsNumber: true,
                        min: {
                            value: 0,
                            message: "Cost price cannot be negative"
                        }
                    })}
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500 (for accurate profit)"
                    className="pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                />
                {errors.costPrice && (
                    <p className="text-red-500 text-xs mt-1">{errors.costPrice.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium">Tax Type <span className="text-rose-500">*</span></label>
                <select
                    {...register("taxType", { required: "Tax type is required" })}
                    className="select select-bordered  pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                >
                    <option value="">Select</option>
                    <option value="inclusive">Inclusive</option>
                    <option value="exclusive">Exclusive</option>
                </select>
                {errors.taxType && (
                    <p className="text-red-500 text-xs mt-1">{errors.taxType.message}</p>
                )}
            </div>

            {/* Tax field - conditionally rendered */}
            {isTaxInclusive && (
                <div>
                    <label className="block text-sm font-medium">Tax (%) <span className="text-rose-500">*</span></label>
                    <input
                        {...register("tax", {
                            required: "Tax is required",
                            valueAsNumber: true
                        })}
                        type="number"
                        step="0.01"
                        placeholder="Enter Tax (%)"
                        className="pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                    />
                    {errors.tax && (
                        <p className="text-red-500 text-xs mt-1">{errors.tax.message}</p>
                    )}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium">Discount Type</label>
                <select
                    {...register("discountType")}
                    className="select select-bordered pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                >
                    <option value="">No Discount</option>
                    <option value="Percentage">Percentage</option>
                    {/* <option value="Fixed">Fixed</option> */}
                </select>
                {errors.discountType && (
                    <p className="text-red-500 text-xs mt-1">{errors.discountType.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium">Discount Value (%)</label>
                <input
                    {...register("discountValue", {
                        valueAsNumber: true,
                        min: {
                            value: 0,
                            message: "Discount cannot be negative"
                        },
                        max: {
                            value: 100,
                            message: "Discount cannot exceed 100%"
                        }
                    })}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter Discount Value (%)"
                    className="pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                />
                {errors.discountValue && (
                    <p className="text-red-500 text-xs mt-1">{errors.discountValue.message}</p>
                )}
            </div>

            <div className="">
                <label className="block text-sm font-medium">Quantity Alert <span className="text-xs font-normal">(optional)</span></label>
                <input
                    {...register("quantityAlert", {
                        valueAsNumber: true
                    })}
                    type="number"
                    placeholder="Enter Quantity Alert"
                    className="pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                />
            </div>
        </div>
    );
};

export default SingleProductFields;
import { useEffect, useState } from "react";
import api from "../utils/api";
import { useParams } from "react-router-dom";
import React, { useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { toast } from "react-toastify"; // Optional: for notifications
import jsPDF from "jspdf";
import Dtales from "../assets/images/Dtales.png";
import "jspdf-autotable";

export default function CustomerSummary() {
  const [quotationData, setQuotationData] = useState(null);
  const [costSummaryData, setCostSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { shareQuotation } = useAuth();

  const contentRef = useRef(null);

  const { id } = useParams();

  // const id = "67b45023e25e2c0a605d5fc8"; // Replace with dynamic ID if needed

  const handleShare = async () => {
    const result = await shareQuotation(quotationData.email, id);
    if (result.success) {
      toast.success("Quotation shared successfully!");
    } else {
      toast.error(result.message);
    }
  };

  const handleDownloadPDF = async () => {
    // Create new PDF document
    const doc = new jsPDF();

    // Add company logo
    const img = new Image();
    img.src = Dtales; // Using the imported logo
    doc.addImage(img, "PNG", 15, 2, 40, 40); // Adjust size and position as needed

    // Set document colors to match your brand
    const primaryColor = [0, 0, 0]; // Black (assuming from your logo)
    const accentColor = [80, 80, 80]; // Dark gray

    // Add customer information
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Quotation Summary", 14, 40);

    // Customer details section
    doc.setFontSize(12);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text("Customer Details:", 14, 50);

    doc.setFontSize(10);
    doc.text(`Name: ${quotationData.customerName}`, 14, 60);
    doc.text(`Mobile: ${quotationData.mobileNumber}`, 14, 65);
    doc.text(`Email: ${quotationData.email}`, 14, 70);
    doc.text(`Property: ${quotationData.propertyName}`, 14, 75);
    doc.text(`Location: ${quotationData.location}`, 14, 80);
    doc.text(`BHK: ${quotationData.bhk}`, 14, 85);

    // Add kitchen data
    const kitchenRooms = quotationData.rooms.filter(
      (room) => room.type === "Kitchen"
    );

    let yPosition = 95;

    // For each kitchen room
    kitchenRooms.forEach((room) => {
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(room.type, 14, yPosition);
      yPosition += 10;

      const kitchenItems = getRoomItems(room);

      if (kitchenItems.length > 0) {
        // Define table columns
        const columns = [
          { header: "Sr.", dataKey: "sr" },
          { header: "Name", dataKey: "name" },
          { header: "Component Type", dataKey: "componentType" },
          { header: "Sizes", dataKey: "sizes" },
          { header: "Price (INR)", dataKey: "price" },
          { header: "Total (INR)", dataKey: "totalPrice" },
        ];

        // Format data for table
        const rows = kitchenItems.map((item) => {
          e;
          return {
            sr: item.sr || "",
            name: item.isHeader
              ? `${item.name}`
              : item.indent
              ? `   ${item.name}`
              : item.name,
            componentType: item.componentType || "",
            sizes: item.sizes || "",
            price: item.price ? item.price.toLocaleString("en-IN") : "",
            totalPrice: item.totalPrice
              ? item.isSectionTotal
                ? `${item.totalPrice.toLocaleString("en-IN")}`
                : item.totalPrice.toLocaleString("en-IN")
              : "",
          };
        });

        // Generate table with custom styling
        doc.autoTable({
          startY: yPosition,
          head: [columns.map((col) => col.header)],
          body: rows.map((row) => columns.map((col) => row[col.dataKey])),
          styles: {
            fontSize: 8,
            cellPadding: 2,
            font: "helvetica",
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: [0, 0, 0], // Black header
            textColor: [255, 255, 255], // White text
            fontStyle: "bold",
          },
          didParseCell: function (data) {
            // Style for section headers
            const rowData = rows[data.row.index];
            if (rowData && rowData.name && rowData.name.startsWith("Section")) {
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.textColor = [0, 0, 0];
              data.cell.styles.fontStyle = "bold";
            }

            // Style for section totals
            if (
              data.column.dataKey === "totalPrice" &&
              rowData &&
              !rowData.sr
            ) {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [0, 0, 0];
            }
          },
          margin: { top: 10 },
          tableLineColor: [200, 200, 200],
          tableLineWidth: 0.1,
        });

        // Update Y position for next content
        yPosition = doc.lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.text("No items added yet", 14, yPosition);
        yPosition += 10;
      }
    });

    // Add total at the bottom
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(
      `Room Total: ₹${Math.round(KitchenRoomTotal).toLocaleString("en-IN")}`,
      14,
      yPosition
    );

    // Add company footer on each page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Footer line
      doc.setDrawColor(0);
      doc.line(14, 275, 196, 275);

      // Company details in footer
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text("DTALES DESIGN STUDIO", 14, 282);
      doc.text("Email: info@dtales.com | Phone: +91 1234567890", 14, 287);
      doc.text("Website: www.dtales.com", 14, 292);

      // Page numbers
      doc.text(`Page ${i} of ${totalPages}`, 170, 292);
    }

    // Save the PDF with a proper name
    doc.save(`Dtales_Quotation_${quotationData.customerName}.pdf`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quotationResponse, costSummaryResponse] = await Promise.all([
          api.get(`/quotations/${id}`),
          api.get(`/quotations/${id}/cost-summary`),
        ]);

        setQuotationData(quotationResponse.data.data);
        setCostSummaryData(costSummaryResponse.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const setSectionPrice = (sectionKey) => {
    const sectionPrice =
      costSummaryData?.rooms?.[0]?.kitchenSummary?.sections?.[sectionKey]
        ?.sectionTotal || 0;
    return sectionPrice;
  };

  // Function to get items for a room section
  const getRoomItems = (room) => {
    const items = [];

    if (room.type === "Kitchen") {
      // Only show sections that have measurements
      Object.entries(room.kitchen.sections).forEach(([sectionKey, section]) => {
        // Only add a section if it has measurements in at least one of base, wall, or loft
        const hasBaseMeasurements = section.base?.measurements?.width > 0;
        const hasWallMeasurements = section.wall?.measurements?.width > 0;
        const hasLoftMeasurements = section.loft?.measurements?.width > 0;

        if (hasBaseMeasurements || hasWallMeasurements || hasLoftMeasurements) {
          // Add section header
          items.push({
            sr: items.length + 1,
            picture: (
              <div className="w-5 h-5 flex items-center justify-center font-bold text-xl bg-gray-200">
                {sectionKey}
              </div>
            ),
            name: `Section ${sectionKey}`,
            componentType: "",
            details: "",
            accessories: "",
            Sizes: "",
            price: null,
            totalPrice: null,
            isHeader: true,
          });

          // Add base items with measurements (only if measurements exist)
          if (hasBaseMeasurements) {
            items.push({
              sr: items.length + 1,
              picture: (
                <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">
                  B
                </div>
              ),
              name: "Base Unit",
              componentType: `Base Measurements -  ${section.base.shutterType.material}`,
              details: "--",
              accessories: "--",
              sizes: `W: ${section.base.measurements.width}mm x D: ${section.base.measurements.depth}mm x H: ${section.base.measurements.height}mm`,
              price: section.base.price?.total || 0,
              totalPrice: section.base.price?.total || 0,
              indent: true,
            });
          }

          // Rest of your code for partitions...
          if (section.base?.partitions?.length > 0) {
            section.base.partitions.forEach((partition) => {
              // Your existing partition code
              items.push({
                sr: items.length + 1,
                picture: (
                  <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">
                    B
                  </div>
                ),
                name: "Base Partition",
                componentType: `${partition.componentType} - ${
                  partition.module || "-"
                }`,
                details: ` ${partition.details.map(
                  (item) => `${item.detail}-(₹${item.price})`
                )}`,
                accessories: `${partition.accessories.map(
                  (item) => ` ${item.name}-(₹${item?.price || "not found"})`
                )}`,
                sizes: `W: ${partition.width}mm`,
                price: partition.price.total,
                totalPrice: partition.price.total,
                indent: true,
              });
            });
          }

          // Add wall items with measurements (only if measurements exist)
          if (hasWallMeasurements) {
            items.push({
              sr: items.length + 1,
              picture: (
                <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">
                  W
                </div>
              ),
              name: "Wall Unit",
              componentType: "Wall Measurements",
              details: "--",
              accessories: "--",
              sizes: `W: ${section.wall.measurements.width}mm x D: ${section.wall.measurements.depth}mm x H: ${section.wall.measurements.height}mm`,
              price: section.wall.price?.total || 0,
              totalPrice: section.wall.price?.total || 0,
              indent: true,
            });
          }

          if (section.wall?.partitions?.length > 0) {
            section.wall.partitions.forEach((partition) => {
              // Your existing partition code
              items.push({
                sr: items.length + 1,
                picture: (
                  <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">
                    W
                  </div>
                ),
                name: "wall Partition",
                componentType: `${partition.componentType} - ${
                  partition.module || "-"
                }`,
                details: ` ${partition.details.map(
                  (item) => `${item.detail}-(₹${item.price})`
                )}`,
                accessories: `${partition.accessories.map(
                  (item) => ` ${item.name}-(₹${item?.price || "not found"})`
                )}`,
                sizes: `W: ${partition.width}mm`,
                price: partition.price.total,
                totalPrice: partition.price.total,
                indent: true,
              });
            });
          }

          if (hasLoftMeasurements) {
            items.push({
              sr: items.length + 1,
              picture: (
                <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">
                  L
                </div>
              ),
              name: "loft Unit",
              componentType: "loft Measurements",
              details: "--",
              accessories: "--",
              sizes: `W: ${section.loft.measurements.width}mm x D: ${section.loft.measurements.depth}mm x H: ${section.loft.measurements.height}mm`,
              price: section.loft.price?.total || 0,
              totalPrice: section.loft.price?.total || 0,
              indent: true,
            });
          }

          if (section.loft?.partitions?.length > 0) {
            section.loft.partitions.forEach((partition) => {
              // Your existing partition code
              items.push({
                sr: items.length + 1,
                picture: (
                  <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">
                    W
                  </div>
                ),
                name: "loft Partition",
                componentType: `loft Partition`,
                details: ` ${partition.details.map(
                  (item) => `${item.detail}-(₹${item.price})`
                )}`,
                accessories: `${partition.accessories.map(
                  (item) => ` ${item.name}-(₹${item?.price || "not found"})`
                )}`,
                sizes: `W: ${partition.width}mm`,
                price: partition.price.total,
                totalPrice: partition.price.total,
                indent: true,
              });
            });
          }

          // Similar changes for wall partitions, loft units, and loft partitions...

          // Add section total at the end
          items.push({
            sr: null,
            picture: null,
            name: "",
            componentType: "",
            details: "",
            accessories: "",
            sizes: "",
            price: "",
            totalPrice: `Section Total ₹${Math.round(
              setSectionPrice(sectionKey)
            )}`,
            isSectionTotal: true,
          });
        }
      });

      return items;
    } else if (
      room.type === "Living Room" ||
      room.type === "Master Bedroom" ||
      room.type === "Bedroom"
    ) {
      // Check if wardrobe exists (typically for bedrooms)
      if (room.wardrobes && room.wardrobes.length > 0) {
        room.wardrobes.forEach((wardrobe, index) => {
          items.push({
            sr: items.length + 1,
            picture: (
              <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">
                W
              </div>
            ),
            name: "Wardrobe",
            componentType: `${wardrobe.carcass.type} - ${wardrobe.finish}`,
            details: `${wardrobe.shutter.material} - ${
              wardrobe.shutter.type || ""
            }`,
            accessories: "--",
            sizes: `W: ${wardrobe.measurements.width}mm x D: ${wardrobe.measurements.depth}mm x H: ${wardrobe.measurements.height}mm`,
            price: wardrobe.totalPrice,
            totalPrice: wardrobe.totalPrice,
          });
        });
      }

      // Check if tvUnits array exists and has items
      if (room.tvUnits && room.tvUnits.length > 0) {
        room.tvUnits.forEach((tvUnit, index) => {
          items.push({
            sr: items.length + 1,
            picture: (
              <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">
                TV
              </div>
            ),
            name: `TV Unit ${index + 1}`,
            componentType: tvUnit.unitType,
            details: `${tvUnit.carcass?.type || ""} - ${tvUnit.finish || ""}`,
            accessories: "--",
            sizes: `W: ${tvUnit.measurements.width}mm x D: ${tvUnit.measurements.depth}mm x H: ${tvUnit.measurements.height}mm`,
            price: tvUnit.totalPrice,
            totalPrice: tvUnit.totalPrice,
          });
        });
      }

      if (room.shoeRacks && room.shoeRacks.length > 0) {
        room.shoeRacks.forEach((shoeRack, index) => {
          items.push({
            sr: items.length + 1,
            picture: (
              <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">
                SR
              </div>
            ),
            name: `Shoe Rack ${index + 1}`,
            componentType: shoeRack.unitType,
            details: `${shoeRack.carcass?.type || ""} - ${
              shoeRack.finish || ""
            }`,
            accessories: `Shelves: ${shoeRack.shelves?.quantity || 0}`,
            sizes: `W: ${shoeRack.measurements.width}mm x D: ${shoeRack.measurements.depth}mm x H: ${shoeRack.measurements.height}mm`,
            price: shoeRack.totalPrice,
            totalPrice: shoeRack.totalPrice,
          });
        });
      }

      if (room.crockeryUnits && room.crockeryUnits.length > 0) {
        room.crockeryUnits.forEach((crockeryUnit, index) => {
          items.push({
            sr: items.length + 1,
            picture: (
              <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">
                CU
              </div>
            ),
            name: `Crockery Units ${index + 1}`,
            componentType: crockeryUnit.unitType,
            details: `${crockeryUnit.carcass?.type || ""} - ${
              crockeryUnit.finish || ""
            }`,
            accessories: `Shelves: ${crockeryUnit.shelves?.quantity || 0}`,
            sizes: `W: ${crockeryUnit.measurements.width}mm x D: ${crockeryUnit.measurements.depth}mm x H: ${crockeryUnit.measurements.height}mm`,
            price: crockeryUnit.totalPrice,
            totalPrice: crockeryUnit.totalPrice,
          });
        });
      }

      // Add summary line if multiple components exist
      if (items.length > 1) {
        items.push({
          sr: null,
          picture: null,
          name: "",
          componentType: "",
          details: "",
          accessories: "",
          sizes: "",
          price: "",
          totalPrice: room.totalPrice,
          isSectionTotal: true,
        });
      }
    }

    return items;
  };

  return (
    <div className="max-w-8xl mx-auto p-4 space-y-8">
      {/* Customer Details */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Customer Name</h3>
            <p className="mt-1">{quotationData.customerName}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Mobile Number</h3>
            <p className="mt-1">{quotationData.mobileNumber}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1">{quotationData.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Property Name</h3>
            <p className="mt-1">{quotationData.propertyName}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="mt-1">{quotationData.location}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">BHK</h3>
            <p className="mt-1">{quotationData.bhk}</p>
          </div>
        </div>
        <button
          onClick={handleShare}
          className="bg-blue-500 text-white px-4 py-2 rounded me-4 cursor-pointer"
        >
          Share Quotation
        </button>

        <button
          onClick={handleDownloadPDF}
          className="bg-transparent  text-blue-700 font-semibold py-2 px-4 border border-blue-500 rounded"
        >
          Download PDF
        </button>
      </div>

      {/* Room Sections */}
      {quotationData.rooms.map((room) => (
        <div
          ref={contentRef}
          key={room.type}
          className="bg-white rounded-lg shadow-sm"
        >
          <h2 className="text-xl font-semibold p-4 border-b">{room.type}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-sm">
                  <th className="font-semibold py-3 px-4 text-left text-gray-600">
                    Sr.
                  </th>
                  <th className="font-semibold py-3 px-4 text-left text-gray-600">
                    Picture
                  </th>
                  <th className="font-semibold py-3 px-4 text-left text-gray-600">
                    Name
                  </th>
                  <th className="font-semibold py-3 px-4 text-left text-gray-600">
                    componentType
                  </th>
                  <th className="font-semibold py-3 px-4 text-left text-gray-600">
                    details
                  </th>
                  <th className="font-semibold py-3 px-4 text-left text-gray-600">
                    accessories
                  </th>
                  <th className="font-semibold py-3 px-4 text-left text-gray-600">
                    Sizes
                  </th>
                  <th className="font-semibold py-3 px-4 text-right text-gray-600">
                    Price (INR)
                  </th>
                  <th className="font-semibold py-3 px-4 text-right text-gray-600">
                    Total Price (INR)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {getRoomItems(room).length > 0 ? (
                  getRoomItems(room).map((item) => (
                    <tr
                      key={item.sr}
                      className={`hover:bg-gray-50 ${
                        item.isHeader ? "bg-gray-100 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3 px-4">{item.sr}</td>
                      <td className="py-3 px-4">
                        <div className="bg-gray-100 p-2 rounded-lg inline-flex">
                          {item.picture}
                        </div>
                      </td>
                      <td className={`py-3 px-4 ${item.indent ? "pl-8" : ""}`}>
                        {item.name}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        {item.componentType}
                      </td>
                      <td className="py-3 px-4 max-w-md">{item.details}</td>
                      <td className="py-3 px-4 max-w-md">{item.accessories}</td>
                      <td className="py-3 px-4">{item.sizes}</td>
                      <td className="py-3 px-4 text-right">
                        {item.price?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 fon text-right">
                        {item.isSectionTotal ? (
                          <strong>
                            {item.totalPrice.toLocaleString("en-IN")}
                          </strong>
                        ) : (
                          item.totalPrice?.toLocaleString("en-IN")
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-4 px-4 text-center text-gray-500"
                    >
                      No items added yet
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium">
                  <td colSpan={8} className="py-3 px-4 text-right">
                    Room Total:
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    ₹{Math.round(room.totalPrice || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">Grand Total</h2>
          <p className="text-xl font-semibold">
            ₹{Math.round(quotationData.totalPrice || 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}

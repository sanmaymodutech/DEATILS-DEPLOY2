import BaseSelection from "../components/BaseSelection";
import CustomerCard from "../components/CustomerCard";
import KitchenMeasurements from "../components/KitchenMeasurements";
import TableComponent from "../components/TableComponent";
import { useAuth } from "../context/Authcontext";

const CustomerList = () => {
  const { step, saveAndNext, prevStep, openTwoD, nextStep } = useAuth();

  const renderStep = () => {
    switch (step) {
      case 1:
        return <TableComponent />;
      case 2:
        return <BaseSelection />;
      case 3:
        return <KitchenMeasurements />;
      case 4:
        return 4;
      default:
        return <TableComponent />;
    }
  };

  return (
    <div className="">
      {step > 1 ? (
        <CustomerCard />
      ) : (
        <h3 className="text-2xl font-semibold text-gray-900 my-5">Customers</h3>
      )}
      {renderStep()}
      <div className="mt-4 flex justify-between">
        {step > 1 && (
          <>
            {!openTwoD && (
              <>
                <button
                  onClick={prevStep}
                  className={`px-4 py-2 bg-gray-300  rounded`}
                >
                  Back
                </button>

                <button
                  onClick={step == 2 ? nextStep : saveAndNext}
                  className="px-4 py-2 bg-blue-300 rounded"
                >
                  {step == 2 ? "Next" : "Save & Next"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerList;

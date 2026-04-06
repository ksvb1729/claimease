import React, { useState } from "react";

type FormData = {
  relationship?: string;
  policyholderName?: string;
  patientName?: string;
  dob?: string;
  gender?: string;
  hospitalizationType?: string;
  admissionDate?: string;
  dischargeDate?: string;
  hospitalName?: string;
  expenses: {
    pre?: number;
    hospital?: number;
    post?: number;
  };
};

const Wizard = ({ onComplete }: any) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({
    expenses: {},
  });

  const next = () => setStep((s) => s + 1);

  const update = (key: any, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateExpense = (key: any, value: any) => {
    setData((prev) => ({
      ...prev,
      expenses: { ...prev.expenses, [key]: value },
    }));
  };

  const screens = [
    // 0 → DOCUMENT READY
    () => (
      <Screen
        title="Before we start"
        subtitle="Keep these ready to fill faster"
        description={[
          "Discharge summary → dates, diagnosis",
          "Hospital bill → total amount",
          "Pharmacy bills → medicines",
          "Policy document → policy number, benefits",
        ]}
        onNext={next}
        button="Start"
      />
    ),

    // 1 → WHO
    () => (
      <Choice
        title="Who was treated?"
        help="This helps me fill relationship correctly"
        options={["Myself", "Father", "Mother", "Spouse", "Child"]}
        onSelect={(v) => {
          update("relationship", v);
          if (v === "Myself") {
            update("patientName", "same");
          }
          next();
        }}
      />
    ),

    // 2 → POLICYHOLDER
    () => (
      <Input
        title="Who holds the insurance policy?"
        help="Name of the person whose policy this is"
        onNext={(v) => {
          update("policyholderName", v);
          next();
        }}
      />
    ),

    // 3 → PATIENT NAME
    () => (
      <Input
        title="Patient's full name"
        help="Name of the person who was treated"
        onNext={(v) => {
          update("patientName", v);
          next();
        }}
      />
    ),

    // 4 → DOB
    () => (
      <Input
        type="date"
        title="Patient's date of birth"
        help="Age will be calculated automatically"
        onNext={(v) => {
          update("dob", v);
          next();
        }}
      />
    ),

    // 5 → GENDER
    () => (
      <Choice
        title="Gender"
        options={["Male", "Female", "Other"]}
        onSelect={(v) => {
          update("gender", v);
          next();
        }}
      />
    ),

    // 6 → WHAT HAPPENED
    () => (
      <Choice
        title="Why was the patient admitted?"
        help="Select the closest reason"
        options={["Illness", "Injury", "Maternity"]}
        onSelect={(v) => {
          update("hospitalizationType", v);
          next();
        }}
      />
    ),

    // 7 → DATES
    () => (
      <DateRange
        title="Hospital stay dates"
        help="You can find this in discharge summary"
        onNext={(from, to) => {
          update("admissionDate", from);
          update("dischargeDate", to);
          next();
        }}
      />
    ),

    // 8 → HOSPITAL
    () => (
      <Input
        title="Hospital name"
        help="Where the treatment happened"
        onNext={(v) => {
          update("hospitalName", v);
          next();
        }}
      />
    ),

    // 9 → PRE EXPENSE
    () => (
      <Choice
        title="Did you spend money before admission?"
        help="Like consultation, tests or medicines"
        options={["Yes", "No"]}
        onSelect={(v) => {
          if (v === "Yes") next();
          else {
            updateExpense("pre", 0);
            setStep(step + 2);
          }
        }}
      />
    ),

    // 10 → PRE AMOUNT
    () => (
      <Input
        title="Amount spent before admission"
        onNext={(v) => {
          updateExpense("pre", Number(v));
          next();
        }}
      />
    ),

    // 11 → HOSPITAL BILL
    () => (
      <Input
        title="Total hospital bill amount"
        help="Main bill from hospital"
        onNext={(v) => {
          updateExpense("hospital", Number(v));
          next();
        }}
      />
    ),

    // 12 → POST EXPENSE
    () => (
      <Choice
        title="Any expenses after discharge?"
        help="Medicines or follow-up visits"
        options={["Yes", "No"]}
        onSelect={(v) => {
          if (v === "Yes") next();
          else {
            updateExpense("post", 0);
            setStep(step + 2);
          }
        }}
      />
    ),

    // 13 → POST AMOUNT
    () => (
      <Input
        title="Amount spent after discharge"
        onNext={(v) => {
          updateExpense("post", Number(v));
          next();
        }}
      />
    ),

    // FINAL
    () => (
      <Screen
        title="You're done 🎉"
        subtitle="We’ll now generate your form"
        onNext={() => onComplete(data)}
        button="Generate Form"
      />
    ),
  ];

  return <div className="wizard">{screens[step]()}</div>;
};

export default Wizard;

/* ---------------- UI COMPONENTS ---------------- */

const Screen = ({ title, subtitle, description, onNext, button }: any) => (
  <div className="card">
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
    {description &&
      description.map((d: string, i: number) => <li key={i}>{d}</li>)}
    <button onClick={onNext}>{button}</button>
  </div>
);

const Choice = ({ title, options, onSelect, help }: any) => (
  <div className="card">
    <h1>{title}</h1>
    {help && <p>{help}</p>}
    {options.map((o: string) => (
      <button key={o} onClick={() => onSelect(o)}>
        {o}
      </button>
    ))}
  </div>
);

const Input = ({ title, onNext, type = "text", help }: any) => {
  const [value, setValue] = useState("");
  return (
    <div className="card">
      <h1>{title}</h1>
      {help && <p>{help}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={() => onNext(value)}>Next</button>
    </div>
  );
};

const DateRange = ({ title, onNext, help }: any) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <div className="card">
      <h1>{title}</h1>
      {help && <p>{help}</p>}
      <input type="date" onChange={(e) => setFrom(e.target.value)} />
      <input type="date" onChange={(e) => setTo(e.target.value)} />
      <button onClick={() => onNext(from, to)}>Next</button>
    </div>
  );
};

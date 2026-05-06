"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StepState, Stepper } from "@/components/ui/Stepper";
import { Toast } from "@/components/ui/Toast";
import { buildRegistrationEmailPayload } from "@/lib/email-preview";
import { createRegistration } from "@/lib/firebase-registrations";
import {
  FieldErrors,
  RegistrationCategory,
  RegistrationFormData,
  TeamMember,
} from "@/lib/types";
import {
  getStepKeysByCategory,
  RegistrationStepKey,
  validateAllSteps,
  validateStepByKey,
} from "@/lib/validation";
import { ConfirmationStep } from "@/components/forms/ConfirmationStep";
import { MemberStep } from "@/components/forms/MemberStep";
import { ResponsibleStep } from "@/components/forms/ResponsibleStep";
import { TeamStep } from "@/components/forms/TeamStep";

type RegistrationFormProps = {
  category: RegistrationCategory;
};

type SubmitStatus = "idle" | "saving" | "uploading" | "success";

const DRAFT_VERSION = 2;
const STEP_LABELS: Record<RegistrationStepKey, string> = {
  team: "Equipo",
  "member-1": "Miembro 1",
  "member-2": "Miembro 2",
  "member-3": "Miembro 3",
  responsible: "Responsable",
  confirmation: "Confirmacion",
};

function createEmptyMember(id: string): TeamMember {
  return {
    id,
    fullName: "",
    age: "",
    email: "",
    whatsapp: "",
    career: "",
    universityYear: "",
    schoolGrade: "",
    about: "",
    studentIdFile: null,
    studentIdFileName: "",
  };
}

function createInitialFormData(category: RegistrationCategory): RegistrationFormData {
  return {
    category,
    teamName: "",
    teamOmegaUpUser: "",
    institution: "",
    discoverySource: "",
    discoverySourceOther: "",
    teamDescription: "",
    contactEmail: "",
    members: [
      createEmptyMember("member-1"),
      createEmptyMember("member-2"),
      createEmptyMember("member-3"),
    ],
    responsible:
      category === "colegios"
        ? {
            fullName: "",
            email: "",
            phone: "",
            institution: "",
            role: "",
            relationship: "",
            comments: "",
          }
        : undefined,
    universityImageConsentAccepted: false,
    schoolImageConsentFiles: [],
    schoolImageConsentFileNames: [],
    dataReviewAccepted: false,
    privacyAccepted: false,
    status: "recibida",
    adminNotes: "",
  };
}

function getDraftStorageKey(category: RegistrationCategory) {
  return `csp-2026-registration-draft-${category}`;
}

function sanitizeDraft(formData: RegistrationFormData) {
  return {
    version: DRAFT_VERSION,
    ...formData,
    members: formData.members.map((member) => ({
      ...member,
      studentIdFile: null,
      studentIdFileName: member.studentIdFile?.name || member.studentIdFileName || "",
    })),
    schoolImageConsentFiles: [],
    schoolImageConsentFileNames:
      formData.schoolImageConsentFiles?.map((file) => file.name) ??
      formData.schoolImageConsentFileNames ??
      [],
  };
}

function parseDraft(rawDraft: string, category: RegistrationCategory): RegistrationFormData | null {
  try {
    const parsed = JSON.parse(rawDraft) as Partial<RegistrationFormData> & {
      version?: number;
    };
    if (parsed.version !== DRAFT_VERSION) return null;

    const initial = createInitialFormData(category);
    const restoredMembers = (parsed.members ?? initial.members).map((member, index) => {
      const base = initial.members[index];
      return {
        ...base,
        ...member,
        studentIdFile: null,
        studentIdFileName: member.studentIdFileName || "",
      };
    }) as RegistrationFormData["members"];

    return {
      ...initial,
      ...parsed,
      category,
      members: restoredMembers,
      schoolImageConsentFiles: [],
      schoolImageConsentFileNames:
        parsed.schoolImageConsentFileNames ?? initial.schoolImageConsentFileNames,
      responsible: category === "colegios" ? parsed.responsible ?? initial.responsible : undefined,
    };
  } catch {
    return null;
  }
}

export function RegistrationForm({ category }: RegistrationFormProps) {
  const router = useRouter();
  const stepKeys = useMemo(() => getStepKeysByCategory(category), [category]);
  const stepLabels = useMemo(() => stepKeys.map((key) => STEP_LABELS[key]), [stepKeys]);
  const storageKey = useMemo(() => getDraftStorageKey(category), [category]);

  const [formData, setFormData] = useState<RegistrationFormData>(() =>
    createInitialFormData(category),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStates, setStepStates] = useState<StepState[]>(
    () => stepKeys.map(() => "default"),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isDraftReady, setIsDraftReady] = useState(false);

  const currentStepKey = stepKeys[currentStepIndex];
  const canGoBack = currentStepIndex > 0;
  const isLastStep = currentStepIndex === stepKeys.length - 1;

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const rawDraft = window.localStorage.getItem(storageKey);
      if (!rawDraft) {
        setIsDraftReady(true);
        return;
      }

      const parsed = parseDraft(rawDraft, category);
      if (parsed) {
        setFormData(parsed);
        setToastMessage(
          "Se restauro un borrador. Debes volver a adjuntar los archivos para enviar.",
        );
      }
      setIsDraftReady(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [category, storageKey]);

  useEffect(() => {
    if (!isDraftReady) return;
    window.localStorage.setItem(storageKey, JSON.stringify(sanitizeDraft(formData)));
  }, [formData, isDraftReady, storageKey]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const submitStatusText =
    submitStatus === "saving"
      ? "Guardando inscripcion..."
      : submitStatus === "uploading"
        ? "Subiendo archivos..."
        : submitStatus === "success"
          ? "Inscripcion enviada"
          : "";

  const setStepStateByValidation = (index: number, stepErrors: FieldErrors) => {
    setStepStates((prev) => {
      const next = [...prev];
      next[index] = Object.keys(stepErrors).length ? "invalid" : "valid";
      return next;
    });
  };

  const validateAndMarkStep = (index: number) => {
    const stepKey = stepKeys[index];
    const stepErrors = validateStepByKey(formData, stepKey);
    setStepStateByValidation(index, stepErrors);
    return stepErrors;
  };

  const updateFormField = <K extends keyof RegistrationFormData>(
    field: K,
    value: RegistrationFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateMember = (memberIndex: number, changes: Partial<TeamMember>) => {
    setFormData((prev) => {
      const nextMembers = [...prev.members] as RegistrationFormData["members"];
      nextMembers[memberIndex] = { ...nextMembers[memberIndex], ...changes };
      return { ...prev, members: nextMembers };
    });
  };

  const updateMemberFile = (memberIndex: number, file: File | null) => {
    updateMember(memberIndex, { studentIdFile: file, studentIdFileName: file?.name ?? "" });
  };

  const goToStep = (index: number) => {
    validateAndMarkStep(currentStepIndex);
    setErrors({});
    setCurrentStepIndex(index);
  };

  const handleNext = () => {
    const stepErrors = validateAndMarkStep(currentStepIndex);
    setErrors(stepErrors);
    setCurrentStepIndex((prev) => Math.min(prev + 1, stepKeys.length - 1));
  };

  const handlePrevious = () => {
    setErrors({});
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const allErrors = validateAllSteps(formData);
    const nextStates = stepKeys.map((stepKey) =>
      Object.keys(validateStepByKey(formData, stepKey)).length ? "invalid" : "valid",
    ) as StepState[];
    setStepStates(nextStates);
    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      setSubmitError("Hay campos pendientes por corregir antes de enviar.");
      return;
    }

    setSubmitError("");
    setSubmitStatus("saving");

    try {
      setSubmitStatus("uploading");
      const registrationId = await createRegistration(formData);
      const emailPayload = buildRegistrationEmailPayload(formData, registrationId);
      console.log(
        "[EMAIL PREVIEW] Pendiente integrar con Resend / SendGrid / Apps Script / Cloud Functions",
        emailPayload,
      );
      setSubmitStatus("success");
      window.localStorage.removeItem(storageKey);
      router.push(`/inscripcion/exito?id=${registrationId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No fue posible enviar la inscripcion.",
      );
      setSubmitStatus("idle");
    }
  };

  return (
    <>
      {toastMessage ? <Toast message={toastMessage} variant="info" /> : null}
      <Card className="space-y-5">
        <Stepper
          currentStep={currentStepIndex}
          onStepClick={goToStep}
          stepStates={stepStates}
          steps={stepLabels}
        />

        {submitStatusText ? (
          <p className="rounded-md bg-csp-soft px-3 py-2 text-sm text-csp-primary">
            {submitStatusText}
          </p>
        ) : null}

        {submitError ? (
          <p className="rounded-md bg-csp-error/10 p-3 text-sm text-csp-error">
            {submitError}
          </p>
        ) : null}

        {currentStepKey === "team" ? (
          <TeamStep errors={errors} formData={formData} onChange={updateFormField} />
        ) : null}

        {currentStepKey === "member-1" ? (
          <MemberStep
            category={formData.category}
            errors={errors}
            member={formData.members[0]}
            memberIndex={0}
            onChange={(changes) => updateMember(0, changes)}
            onFileChange={(file) => updateMemberFile(0, file)}
          />
        ) : null}

        {currentStepKey === "member-2" ? (
          <MemberStep
            category={formData.category}
            errors={errors}
            member={formData.members[1]}
            memberIndex={1}
            onChange={(changes) => updateMember(1, changes)}
            onFileChange={(file) => updateMemberFile(1, file)}
          />
        ) : null}

        {currentStepKey === "member-3" ? (
          <MemberStep
            category={formData.category}
            errors={errors}
            member={formData.members[2]}
            memberIndex={2}
            onChange={(changes) => updateMember(2, changes)}
            onFileChange={(file) => updateMemberFile(2, file)}
          />
        ) : null}

        {currentStepKey === "responsible" && formData.responsible ? (
          <ResponsibleStep
            errors={errors}
            onChange={(changes) =>
              setFormData((prev) => ({
                ...prev,
                responsible: {
                  ...prev.responsible!,
                  ...changes,
                },
              }))
            }
            responsible={formData.responsible}
          />
        ) : null}

        {currentStepKey === "confirmation" ? (
          <ConfirmationStep
            errors={errors}
            formData={formData}
            onSchoolConsentFilesChange={(files) =>
              setFormData((prev) => ({
                ...prev,
                schoolImageConsentFiles: files,
                schoolImageConsentFileNames: files.map((file) => file.name),
              }))
            }
            onToggle={(field, value) =>
              setFormData((prev) => ({
                ...prev,
                [field]: value,
              }))
            }
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-csp-soft pt-4">
          <Button disabled={!canGoBack} onClick={handlePrevious} type="button" variant="secondary">
            Atras
          </Button>
          {!isLastStep ? (
            <Button onClick={handleNext} type="button">
              Siguiente
            </Button>
          ) : (
            <Button
              isLoading={submitStatus === "saving" || submitStatus === "uploading"}
              onClick={handleSubmit}
              type="button"
            >
              Enviar inscripcion
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}

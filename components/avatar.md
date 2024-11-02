here are files that worked for me to generate avatar in previous versions of the app:

avatar-creator.tsx
"use client"

import React, { useState, useRef, useEffect, useCallback, useReducer } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "./ui/card"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Loader2, ChevronDown, ChevronUp, Download, Upload, Edit, Save, X, Plus, Trash, FolderOpen, MoonIcon, SunIcon } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { AvatarData } from "../types/avatar"
import toast from 'react-hot-toast'
import { SnakeGame } from './SnakeGame'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from 'next/image'
import { Button } from "./ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "./theme-toggle"
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { get, set, cloneDeep } from 'lodash'
import debounce from 'lodash/debounce'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import * as AvatarTypes from '../types/avatar';
import { truncate } from 'lodash';
// @ts-ignore
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import html2canvas from 'html2canvas';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const sectionToPropertyMap: Record<string, keyof AvatarData> = {
  "personal-details": "details",
  "story": "story",
  "current-wants": "currentWants",
  "pain-points": "painPoints",
  "desires": "desires",
  "offer-results": "offerResults",
  "biggest-problem": "biggestProblem",
  "humiliation": "humiliation",
  "frustrations": "frustrations",
  "complaints": "complaints",
  "worries": "worries",
  "cost-of-not-buying": "costOfNotBuying",
  "biggest-want": "biggestWant",
};

// Define action types
type Action = 
  | { type: 'ADD_PROBLEM'; path: string }
  | { type: 'ADD_ITEM'; path: string }
  | { type: 'EDIT_FIELD'; path: string; value: string }
  | { type: 'REMOVE_ITEM'; path: string; index: number }
  | { type: 'SET_AVATAR'; avatar: AvatarData | null };

// Reducer function
function avatarReducer(state: AvatarData | null, action: Action): AvatarData | null {
  if (!state) return state;
  
  let updatedState = { ...state };

  switch (action.type) {
    case 'ADD_PROBLEM': {
      const currentValue = get(updatedState, action.path);
      let newValue;
      if (Array.isArray(currentValue)) {
        newValue = [...currentValue, ''];
      } else if (typeof currentValue === 'string') {
        newValue = [currentValue, ''];
      } else {
        newValue = [''];
      }
      set(updatedState, action.path, newValue);
      break;
    }
    case 'ADD_ITEM': {
      const list = get(updatedState, action.path);
      if (Array.isArray(list)) {
        set(updatedState, action.path, [...list, { main: '', subPoints: [] }]);
      } else {
        set(updatedState, action.path, [{ main: '', subPoints: [] }]);
      }
      break;
    }
    case 'EDIT_FIELD': {
      const currentValue = get(updatedState, action.path);
      if (Array.isArray(currentValue)) {
        set(updatedState, action.path, [...currentValue, action.value]);
      } else if (typeof currentValue === 'string' && action.value.startsWith('[') && action.value.endsWith(']')) {
        set(updatedState, action.path, action.value);
      } else {
        set(updatedState, action.path, action.value);
      }
      break;
    }
    case 'REMOVE_ITEM': {
      const list = get(updatedState, action.path);
      if (Array.isArray(list)) {
        list.splice(action.index, 1);
        set(updatedState, action.path, list);
      }
      break;
    }
    case 'SET_AVATAR':
      return action.avatar;
    default:
      return state;
  }

  return updatedState;
}

export function AvatarCreatorComponent() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState({
    targetAudience: "",
    helpDescription: "",
    offerType: "lowTicket", // Default value
  })
  const [generatedAvatar, setGeneratedAvatar] = useState<AvatarData | null>(null)
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedAvatar, dispatch] = useReducer(avatarReducer, null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showSnakeGame, setShowSnakeGame] = useState(false)
  const notificationIdRef = useRef<string | null>(null)
  const [savedAvatars, setSavedAvatars] = useLocalStorage<AvatarData[]>("savedAvatars", []);
  const [currentAvatarId, setCurrentAvatarId] = useState<number | null>(null);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);
  const isAddingProblemRef = useRef(false);
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("personal-details");
  const [editorContents, setEditorContents] = useState<Record<string, string>>({});
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);
  const [offerType, setOfferType] = useState<string>("lowTicket"); // Default to low ticket

  // Define the set of sections without the "Add with AI" button
  const sectionsWithoutAddWithAI = new Set(["personal-details", "offer-details"]);

  useEffect(() => {
    console.log('Generated Avatar updated:', generatedAvatar);
  }, [generatedAvatar]);

  useEffect(() => {
    if (generatedAvatar) {
      const initialContents: Record<string, string> = {};
      Object.entries(sectionToPropertyMap).forEach(([section, property]) => {
        const sectionData = generatedAvatar[property as keyof AvatarTypes.AvatarData];
        initialContents[section] = formatSectionData(sectionData);
      });
      setEditorContents(initialContents);
    }
  }, [generatedAvatar]);

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const formatSectionData = (data: any): string => {
    if (typeof data === 'string') {
      return data;
    } else if (Array.isArray(data)) {
      return data.map(item => formatSectionData(item)).join('<br><br>');
    } else if (typeof data === 'object' && data !== null) {
      if ('main' in data && 'subPoints' in data) {
        return `<h3 class="font-poppins"><strong>${capitalizeFirstLetter(data.main)}</strong></h3><ul>${data.subPoints.map((point: string) => `<li>${point}</li>`).join('')}</ul>`;
      } else if ('financial' in data && 'emotional' in data && 'social' in data) {
        // Handle the "Cost of Not Buying" structure
        return `
          <h3 class="font-poppins"><strong>Financial</strong></h3>
          <p>${data.financial}</p>
          <h3 class="font-poppins"><strong>Emotional</strong></h3>
          <p>${data.emotional}</p>
          <h3 class="font-poppins"><strong>Social</strong></h3>
          <p>${data.social}</p>
        `;
      } else if ('financial' in data && 'emotional' in data) {
        // Handle the "Biggest Problem" structure
        return `
          <div class="biggest-problem">
            <h3 class="font-poppins"><strong>Financial</strong></h3>
            <p><strong>Desire:</strong> ${data.financial.desire}</p>
            <p><strong>Problem:</strong> ${Array.isArray(data.financial.problem) 
              ? data.financial.problem.join(', ')
              : data.financial.problem}</p>
            
            <h3 class="font-poppins mt-4"><strong>Emotional</strong></h3>
            <p><strong>Desire:</strong> ${data.emotional.desire}</p>
            <p><strong>Problem:</strong> ${Array.isArray(data.emotional.problem)
              ? data.emotional.problem.join(', ')
              : data.emotional.problem}</p>
          </div>
        `;
      } else {
        return Object.entries(data).map(([key, value]) => `<h3 class="font-poppins"><strong>${capitalizeFirstLetter(key)}:</strong></h3> ${value}`).join('<br>');
      }
    }
    return JSON.stringify(data);
  };

  const formatArrayOfObjects = (arr: any[]): string => {
    return arr.map(item => `
      <h4 class="font-poppins"><strong>${capitalizeFirstLetter(item.main)}</strong></h4>
      <ul>
        ${item.subPoints.map((subPoint: string) => `<li>${subPoint}</li>`).join('')}
      </ul>
    `).join('');
  };

  const handleInputChange = (field: string, value: string) => {
    setInitialData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOfferTypeChange = (value: string) => {
    setInitialData(prev => ({ ...prev, offerType: value }));
  };

  const generateAvatar = async () => {
    setLoading(true);
    setShowSnakeGame(true);
    notificationIdRef.current = toast.loading("Your avatar is being generated...", {
      duration: Infinity,
      position: "top-right",
      // ... other toast options
    });

    try {
      const response = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience: initialData.targetAudience,
          helpDescription: initialData.helpDescription,
          offerType: initialData.offerType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate avatar");
      }

      const data = await response.json();
      
      // Extract name from the story if it's not in shortDescription
      const extractNameFromStory = (story: string) => {
        const firstWord = story.split(' ')[0];
        return firstWord.match(/^[A-Z][a-z]+$/) ? firstWord : null;
      };

      // Extract name, profession, and niche from the AI-generated description
      // or use fallback values if shortDescription is not available
      const name = data.shortDescription?.name || 
                   data.details?.name || 
                   extractNameFromStory(data.story) || 
                   "Unnamed";
      const profession = data.shortDescription?.profession || data.details?.career || "Professional";
      const niche = data.shortDescription?.niche || initialData.helpDescription || "General";
      
      // Update the avatar data with the extracted information
      const updatedData = {
        ...data,
        details: {
          ...data.details,
          name,
          profession,
          niche
        },
        shortDescription: { name, profession, niche }
      };

      setGeneratedAvatar(updatedData);
      setCurrentAvatarId(null);
      setStep(2);
      toast.success('Avatar generated successfully!');

      // Automatically generate the avatar image
      await generateAvatarImage(updatedData);
    } catch (error) {
      console.error("Error generating avatar:", error);
      toast.error(`Failed to generate avatar: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setShowSnakeGame(false);
      if (notificationIdRef.current) {
        toast.dismiss(notificationIdRef.current);
        notificationIdRef.current = null;
      }
    }
  };

  const generateAvatarImage = async (avatarData: AvatarData) => {
    if (!avatarData || !avatarData.details) {
      console.error('Avatar details are missing');
      toast.error('Avatar details are missing. Unable to generate image.');
      return;
    }

    const { gender = 'person', ageRange = 'adult', career = 'professional' } = avatarData.details;
    console.log('Avatar Details:', { gender, ageRange, career });

    const prompt = `${gender} ${ageRange} ${career} portrait`.trim();
    console.log('Generated Prompt:', prompt);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    setAvatarImageUrl(imageUrl);
    toast.success('Avatar image generated successfully');
  };

  const toggleAllTabs = (open: boolean) => {
    const allTabs = [
      "personal-details", "story", "current-wants", "pain-points", "desires",
      "offer-results", "biggest-problem", "humiliation", "frustrations",
      "complaints", "worries", "cost-of-not-buying", "biggest-want", "offer-details"
    ]
    setOpenTabs(open ? allTabs : [])
  }

  const handleDownload = () => {
    if (!generatedAvatar) return
    const jsonString = JSON.stringify(generatedAvatar, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "avatar.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Avatar downloaded successfully!')
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const uploadedAvatar = JSON.parse(e.target?.result as string) as AvatarData
          setGeneratedAvatar(uploadedAvatar)
          setStep(2)
          toast.success('Avatar loaded successfully!')
        } catch (error) {
          console.error("Error parsing JSON:", error)
          toast.error('Invalid file format. Please upload a valid JSON file.')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleAddProblem = useCallback((path: string) => {
    dispatch({ type: 'ADD_PROBLEM', path });
  }, []);

  const handleEditChange = useCallback((path: string, value: string) => {
    dispatch({ type: 'EDIT_FIELD', path, value });
  }, []);

  const handleRemoveItem = useCallback((path: string, index: number) => {
    dispatch({ type: 'REMOVE_ITEM', path, index });
  }, []);

  const startEditing = () => {
    dispatch({ type: 'SET_AVATAR', avatar: generatedAvatar });
    setIsEditing(true)
  }

  const saveEdits = () => {
    if (editedAvatar) {
      const emptyFields = validateAvatar(editedAvatar)
      if (emptyFields.length > 0) {
        toast.error(`Please fill in the following fields: ${emptyFields.join(', ')}`)
        return
      }

      setGeneratedAvatar(editedAvatar)
      setIsEditing(false)
      toast.success('Avatar updated successfully!')
    } else {
      toast.error('No changes to save.')
    }
  }

  const validateAvatar = (avatar: AvatarData): string[] => {
    const emptyFields: string[] = [];

    // Check required fields
    if (!avatar.details || Object.values(avatar.details).some(value => !value)) {
      emptyFields.push('details');
    }
    if (!avatar.story) emptyFields.push('story');
    if (!avatar.currentWants || !avatar.currentWants.main || avatar.currentWants.subPoints.length === 0) {
      emptyFields.push('currentWants');
    }
    if (!avatar.biggestWant || !avatar.biggestWant.main || avatar.biggestWant.subPoints.length === 0) {
      emptyFields.push('biggestWant');
    }

    // Check array fields
    const arrayFields: (keyof AvatarData)[] = ['painPoints', 'desires', 'offerResults', 'humiliation', 'frustrations', 'complaints', 'worries'];
    arrayFields.forEach(field => {
      const value = avatar[field];
      if (Array.isArray(value)) {
        if (value.length === 0) emptyFields.push(field);
      } else {
        emptyFields.push(field); // Field is not an array as expected
      }
    });

    // Check costOfNotBuying
    if (!avatar.costOfNotBuying || 
        !avatar.costOfNotBuying.emotional || 
        !avatar.costOfNotBuying.financial || 
        !avatar.costOfNotBuying.social) {
      emptyFields.push('costOfNotBuying');
    }

    // Check biggestProblem
    if (!avatar.biggestProblem || 
        !avatar.biggestProblem.financial || 
        !avatar.biggestProblem.financial.desire || 
        !avatar.biggestProblem.financial.problem ||
        !avatar.biggestProblem.emotional || 
        !avatar.biggestProblem.emotional.desire || 
        !avatar.biggestProblem.emotional.problem) {
      emptyFields.push('biggestProblem');
    }

    return emptyFields;
  };

  const cancelEdits = () => {
    dispatch({ type: 'SET_AVATAR', avatar: null });
    setIsEditing(false)
  }

  const fillExampleData = () => {
    if (step === 1) {
      setInitialData({
        targetAudience: "Busy professionals, New parents, Small business owners",
        helpDescription: "Helping them manage their time more effectively and reduce stress",
        offerType: "lowTicket",
      });
      toast.success("Example data filled!");
    } else {
      // You can define what filling example data means for step 2
      // For now, let's just show a toast
      toast("Example data is only available in step 1");
    }
  };

  const renderEditableField = (label: string, fieldPath: string, value: string) => {
    return (
      <div className="mb-4">
        <Label>{label}</Label>
        <Input
          value={value}
          onChange={(e) => handleEditChange(fieldPath, e.target.value)}
          className="mt-1"
        />
      </div>
    );
  };

  const renderEditableList = (label: string, fieldPath: string, list: any[] | string) => {
    const items = Array.isArray(list) ? list : [list];
    return (
      <div className="mb-4">
        <Label>{label}</Label>
        {items.map((item, index) => {
          const itemPath = `${fieldPath}[${index}]`;
          return (
            <div key={index} className="flex items-center mt-1">
              {typeof item === 'object' ? (
                <>
                  {Object.entries(item).map(([key, value]) => (
                    <Input
                      key={key}
                      value={value as string}
                      onChange={(e) => handleEditChange(`${itemPath}.${key}`, e.target.value)}
                      className="flex-grow mr-2"
                      placeholder={key}
                    />
                  ))}
                </>
              ) : (
                <Input
                  value={item}
                  onChange={(e) => handleEditChange(itemPath, e.target.value)}
                  className="flex-grow"
                />
              )}
              <Button
                onClick={() => handleRemoveItem(fieldPath, index)}
                variant="ghost"
                size="sm"
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        <Button
          onClick={() => handleAddItem(fieldPath)}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>
    );
  };

  const renderEditableContent = (section: string) => {
    if (!editedAvatar) return null;
    const property = sectionToPropertyMap[section];
    const sectionData = editedAvatar[property as keyof AvatarData];

    if (property === 'details') {
      return (
        <div className="space-y-4">
          {Object.entries(sectionData as Record<string, string>).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <Label htmlFor={key} className="mb-1 font-semibold capitalize">{key}</Label>
              <Input
                id={key}
                value={value}
                onChange={(e) => handleEditChange(`${property}.${key}`, e.target.value)}
                className="w-full"
              />
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(sectionData)) {
      return (
        <div>
          {sectionData.map((item, index) => (
            <div key={index} className="flex items-center mb-2">
              {typeof item === 'string' ? (
                <Input
                  value={item}
                  onChange={(e) => handleEditChange(`${property}[${index}]`, e.target.value)}
                  className="flex-grow mr-2"
                />
              ) : (
                <div className="w-full">
                  <Input
                    value={item.main}
                    onChange={(e) => handleEditChange(`${property}[${index}].main`, e.target.value)}
                    className="w-full mb-2"
                  />
                  {item.subPoints.map((subPoint, subIndex) => (
                    <Input
                      key={subIndex}
                      value={subPoint}
                      onChange={(e) => handleEditChange(`${property}[${index}].subPoints[${subIndex}]`, e.target.value)}
                      className="w-full mb-2"
                    />
                  ))}
                </div>
              )}
              <Button
                onClick={() => handleRemoveItem(property, index)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            onClick={() => handleAddItem(property)}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      );
    } else if (typeof sectionData === 'object' && sectionData !== null) {
      // Handle object types (like biggestProblem)
      return (
        <div>
          {Object.entries(sectionData).map(([key, value]) => (
            <div key={key} className="mb-4">
              <Label>{key}</Label>
              {typeof value === 'object' && value !== null ? (
                Object.entries(value).map(([subKey, subValue]) => (
                  <div key={subKey} className="mt-2">
                    <Label>{subKey}</Label>
                    <Input
                      value={subValue as string}
                      onChange={(e) => handleEditChange(`${property}.${key}.${subKey}`, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ))
              ) : (
                <Input
                  value={value as string}
                  onChange={(e) => handleEditChange(`${property}.${key}`, e.target.value)}
                  className="mt-1"
                />
              )}
            </div>
          ))}
        </div>
      );
    }

    // For any other type of data, render as is
    return <pre>{JSON.stringify(sectionData, null, 2)}</pre>;
  };

  const handleEditorChange = (content: string, section: string) => {
    setEditorContents(prev => ({ ...prev, [section]: content }));
    // You may want to debounce this update to avoid too frequent state changes
    setGeneratedAvatar(prev => {
      if (!prev) return prev;
      const property = sectionToPropertyMap[section];
      return { ...prev, [property]: content };
    });
  };

  const handleAddItem = useCallback((path: string) => {
    dispatch({ type: 'ADD_ITEM', path });
  }, []);

  const avatarSections = [
    { id: "personal-details", title: "Personal Details", icon: "👤" },
    { id: "story", title: "Story", icon: "📖" },
    { id: "current-wants", title: "Current Wants", icon: "🎯" },
    { id: "pain-points", title: "Pain Points", icon: "😣" },
    { id: "desires", title: "Desires", icon: "✨" },
    { id: "offer-results", title: "Offer Results", icon: "🏆" },
    { id: "biggest-problem", title: "Biggest Problem", icon: "❗" },
    { id: "humiliation", title: "Humiliation", icon: "😓" },
    { id: "frustrations", title: "Frustrations", icon: "😤" },
    { id: "complaints", title: "Complaints", icon: "🗣️" },
    { id: "cost-of-not-buying", title: "Cost of Not Buying", icon: "💸" },
    { id: "biggest-want", title: "Biggest Want", icon: "🌟" },
  ];

  const renderSectionContent = (section: string) => {
    if (!generatedAvatar) return null;
    const property = sectionToPropertyMap[section];
    const sectionData = generatedAvatar[property as keyof AvatarTypes.AvatarData];

    if (!sectionData) return <p>No data available for this section.</p>;

    const sectionInfo = avatarSections.find(s => s.id === section);
    const sectionTitle = sectionInfo ? `${sectionInfo.icon} ${sectionInfo.title}` : section;

    return (
      <div id={section}>
        <h2 className="text-xl font-bold mb-4">{sectionTitle}</h2>
        <ReactQuill
          theme="snow"
          value={editorContents[section] || ''}
          onChange={(content) => handleEditorChange(content, section)}
          modules={{
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{'list': 'ordered'}, {'list': 'bullet'}],
              ['link', 'image'],
              ['clean']
            ],
          }}
        />
      </div>
    );
  };

  const generatePDF = async () => {
    if (!generatedAvatar) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yOffset = 20; // Initial top margin
    const leftMargin = 20;
    const rightMargin = 20;
    const maxContentWidth = pageWidth - leftMargin - rightMargin;

    // Set a base font style
    pdf.setFont("helvetica", "normal");

    // Function to add styled text with color, wrapping, and proper spacing
    const addStyledText = (text: string, fontSize: number, isBold = false, color = [0, 0, 0], indent = 0) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setTextColor(color[0], color[1], color[2]);
      const splitText = pdf.splitTextToSize(text, maxContentWidth - indent);
      splitText.forEach((line: string) => {
        pdf.text(line, leftMargin + indent, yOffset);
        yOffset += fontSize * 0.8; // Adjust line height
      });
      yOffset += 5; // Add extra space after each text block
    };

    // Add a simple header for the document with color
    const addHeader = (title: string) => {
      pdf.setFillColor(200, 200, 250);  // Light blue background
      pdf.rect(leftMargin, yOffset, maxContentWidth, 10, 'F');  // Filled rectangle for background
      addStyledText(title, 16, true, [0, 0, 128]);  // Add header text with color
    };

    // Add the avatar image
    if (avatarImageUrl) {
      try {
        const img = await loadImage(avatarImageUrl);
        const imgWidth = 50;
        const imgHeight = (img.height * imgWidth) / img.width;
        pdf.addImage(avatarImageUrl, 'JPEG', leftMargin, yOffset, imgWidth, imgHeight);
        yOffset += imgHeight + 10;
      } catch (error) {
        console.error('Failed to load avatar image:', error);
      }
    }

    // Add avatar name and niche with color styling
    addStyledText(generatedAvatar.details.name || 'Avatar', 18, true, [0, 0, 0]);
    addStyledText(generatedAvatar.details.niche || 'General', 14, false, [80, 80, 80]);

    // Loop through sections and style each
    for (const section of avatarSections) {
      addHeader(section.icon + ' ' + section.title);  // Use header style for section title

      // Parse content from editor
      const content = editorContents[section.id] || '';
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');

      doc.body.childNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          switch (element.tagName) {
            case 'H1':
            case 'H2':
            case 'H3':
              addStyledText(element.textContent || '', 14, true, [50, 50, 50]);
              break;
            case 'P':
              addStyledText(element.textContent || '', 12, false, [0, 0, 0]);
              break;
            case 'UL':
              element.querySelectorAll('li').forEach((li, index) => {
                if (index === 0) {
                  // Main point bold
                  addStyledText('• ' + (li.textContent || ''), 12, true, [0, 0, 0], 5);
                } else {
                  // Subsequent points
                  addStyledText('• ' + (li.textContent || ''), 12, false, [0, 0, 0], 10);
                }
              });
              break;
            case 'OL':
              element.querySelectorAll('li').forEach((li, index) => {
                const number = index + 1;
                addStyledText(`${number}. ${li.textContent || ''}`, 12, index === 0, [0, 0, 0], index === 0 ? 5 : 10);
              });
              break;
          }
        }
      });

      // Add space between sections
      yOffset += 10;

      // Handle page break if necessary
      if (yOffset > pageHeight - 30) {
        pdf.addPage();
        yOffset = 20;
      }
    }

    // Add footer
    const addFooter = () => {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${pdf.internal.getNumberOfPages()}`, pageWidth - 30, pageHeight - 10);  // Page numbering
    };
    addFooter();

    pdf.save('avatar-profile.pdf');
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (error: Event) => reject(error);
      img.src = url;
    });
  };

  const addWithAI = async (section: string) => {
    setGeneratingSection(section);
    const toastId = toast.loading(`Generating new content for ${section}...`);

    try {
      setLoading(true);
      console.log(`Generating new points for section: ${section}`);
      
      const response = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, avatarData: generatedAvatar }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate new points');
      }

      const newPoints = await response.json();
      console.log('New points generated:', newPoints);

      setGeneratedAvatar((prev) => {
        if (!prev) return prev;
        const property = sectionToPropertyMap[section];
        const currentContent = prev[property as keyof AvatarData];
        const updatedContent = formatSectionData(currentContent) + '<br><br>' + formatSectionData(newPoints);
        return {
          ...prev,
          [property]: updatedContent,
        };
      });

      toast.success(`Added new points to ${section}`, { id: toastId });
    } catch (error) {
      console.error("Error adding with AI:", error);
      toast.error(`Failed to add new points: ${error instanceof Error ? error.message : "Unknown error"}`, { id: toastId });
    } finally {
      setLoading(false);
      setGeneratingSection(null);
    }
  };

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  };

  const slideIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

  const renderSection = (section: string, content: React.ReactNode) => (
    <motion.div {...fadeIn}>
      <AccordionItem value={section}>
        <AccordionTrigger className="text-black dark:text-white">{section}</AccordionTrigger>
        <AccordionContent className="text-black dark:text-white">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {content}
            {/* The "Add with AI" button has been removed from here */}
          </motion.div>
        </AccordionContent>
      </AccordionItem>
    </motion.div>
  );

  const extractNameFromStory = (story: string): string => {
    const words = story.split(' ');
    const nameIndex = words.findIndex(word => /^[A-Z][a-z]+$/.test(word));
    return nameIndex !== -1 ? words[nameIndex] : 'Unnamed';
  };

  const getAvatarNameAndNiche = () => {
    if (generatedAvatar) {
      const name = extractNameFromStory(generatedAvatar.story);
      const niche = truncate(
        initialData.helpDescription || 
        'Unknown Niche', 
        { length: 30, omission: '...' }
      );
      return { name, niche };
    }
    return { name: 'Unnamed', niche: 'Unknown Niche' };
  };

  const getAvatarDescription = (avatar: AvatarData | null) => {
    if (!avatar) return "Your AI-Generated Avatar";
    if (avatar.shortDescription) {
      const { name, profession, niche } = avatar.shortDescription;
      return `${name} - ${profession} - ${niche}`;
    } else {
      const { name, career } = avatar.details;
      return `${name || 'Unnamed'} - ${career || 'Unknown Profession'}`;
    }
  };

  const saveAvatar = () => {
    if (generatedAvatar) {
      const { name, niche } = getAvatarNameAndNiche();
      const avatarName = `${name} - ${niche}`;
      
      const updatedAvatar: AvatarData = { 
        ...generatedAvatar, 
        name: avatarName,
        imageUrl: avatarImageUrl || undefined // Use undefined instead of null
      };
      
      if (currentAvatarId !== null) {
        // Update existing avatar
        const updatedAvatars = savedAvatars.map((avatar, index) =>
          index === currentAvatarId ? updatedAvatar : avatar
        );
        setSavedAvatars(updatedAvatars);
        toast.success("Avatar updated successfully!");
      } else {
        // Save as new avatar
        const updatedAvatars = [...savedAvatars, updatedAvatar];
        setSavedAvatars(updatedAvatars);
        setCurrentAvatarId(updatedAvatars.length - 1);
        toast.success("New avatar saved successfully!");
      }
    }
  };

  const loadSavedAvatar = (avatar: AvatarData, index: number) => {
    setGeneratedAvatar(avatar);
    setCurrentAvatarId(index);
    setStep(2);
    toast.success("Avatar loaded successfully!");
  };

  const deleteCurrentAvatar = () => {
    if (currentAvatarId !== null) {
      const updatedAvatars = savedAvatars.filter((_, index) => index !== currentAvatarId);
      setSavedAvatars(updatedAvatars);

      if (updatedAvatars.length > 0) {
        // Load the next available avatar
        const nextAvatarIndex = currentAvatarId >= updatedAvatars.length ? updatedAvatars.length - 1 : currentAvatarId;
        setGeneratedAvatar(updatedAvatars[nextAvatarIndex]);
        setCurrentAvatarId(nextAvatarIndex);
        toast.success('Avatar deleted. Loaded next available avatar.');
      } else {
        // No avatars left, return to initial screen
        setGeneratedAvatar(null);
        setCurrentAvatarId(null);
        setStep(1);
        toast.success('Avatar deleted. No more avatars available.');
      }
    } else {
      toast.error('No avatar selected for deletion.');
    }
  };

  const handleAddSubPoint = useCallback((property: string, index: number) => {
    dispatch({ 
      type: 'EDIT_FIELD', 
      path: `${property}[${index}].subPoints`, 
      value: JSON.stringify([...JSON.parse(get(editedAvatar, `${property}[${index}].subPoints`, '[]')), ''])
    });
  }, [editedAvatar]);

  const handleDownloadJSON = () => {
    if (generatedAvatar) {
      const jsonString = JSON.stringify(generatedAvatar, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'avatar_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {isClient ? (
        <>
          {step === 1 ? (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                    AI Avatar + Offer Creator
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  >
                    {theme === "light" ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </div>
                <CardDescription className="text-lg mt-1">
                  Tell us about your target audience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); generateAvatar(); }} className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Who are you helping?</Label>
                    <Input
                      id="targetAudience"
                      placeholder="E.g., Busy professionals, New parents, Small business owners"
                      value={initialData.targetAudience}
                      onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="helpDescription">What are you helping them with?</Label>
                    <Textarea
                      id="helpDescription"
                      placeholder="Describe the problem you're solving or the transformation you're offering"
                      value={initialData.helpDescription}
                      onChange={(e) => handleInputChange("helpDescription", e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offerType">Choose your offer type</Label>
                    <Select
                      value={initialData.offerType}
                      onValueChange={handleOfferTypeChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select offer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lowTicket">Low Ticket Offer</SelectItem>
                        <SelectItem value="highTicket">High Ticket Offer</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Avatar
                        </>
                      ) : (
                        "Generate Avatar and Offer"
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={fillExampleData}>
                      Fill Example
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80">
                          Load Avatar <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Saved Avatars</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {savedAvatars.map((avatar, index) => (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem onClick={() => loadSavedAvatar(avatar, index)}>
                                  {truncate(avatar.name || `Avatar ${index + 1}`, { length: 20, omission: '...' })}
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{avatar.name || `Avatar ${index + 1}`}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center mt-6">
                <p className="text-sm text-muted-foreground">
                  AI-powered avatar creation • Customizable profiles • Instant offer generation
                </p>
              </CardFooter>
            </Card>
          ) : (
            <motion.div key="step2" {...slideIn}>
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                        {avatarImageUrl ? (
                          <AvatarImage src={avatarImageUrl} alt="Generated Avatar" />
                        ) : (
                          <AvatarFallback>AI</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                          {getAvatarDescription(generatedAvatar)}
                        </CardTitle>
                        <CardDescription className="text-lg mt-1">
                          AI-generated avatar based on your inputs
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2 flex-wrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80">
                            Load Avatar <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Saved Avatars</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {savedAvatars.map((avatar, index) => (
                            <TooltipProvider key={index}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DropdownMenuItem onClick={() => loadSavedAvatar(avatar, index)}>
                                    {truncate(avatar.name || `Avatar ${index + 1}`, { length: 20, omission: '...' })}
                                  </DropdownMenuItem>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{avatar.name || `Avatar ${index + 1}`}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80" onClick={saveAvatar}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Avatar
                      </Button>
                      <Button variant="outline" size="sm" className="bg-white hover:bg-gray-100" onClick={handleDownloadJSON}>
                        <Download className="mr-2 h-4 w-4" />
                        Download JSON
                      </Button>
                      <Button variant="outline" size="sm" className="bg-white hover:bg-gray-100" onClick={generatePDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                      <Button variant="destructive" size="sm" onClick={deleteCurrentAvatar}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Avatar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-6">
                  <Tabs defaultValue="personal-details">
                    <div className="-mt-8 mb-8">
                      <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 bg-white/50 p-2 rounded-lg">
                        {avatarSections.map((section) => (
                          <TabsTrigger
                            key={section.id}
                            value={section.id}
                            className="px-3 py-1 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm flex flex-col items-center text-center h-auto"
                          >
                            <span className="text-lg mb-1">{section.icon}</span>
                            <span className="whitespace-normal">{section.title}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    <div className="mt-16 pt-8 border-t border-gray-200"> {/* Increased top margin and padding */}
                      {avatarSections.map((section) => (
                        <TabsContent key={section.id} value={section.id}>
                          <Card className="bg-white/70 backdrop-blur-sm shadow-lg">
                            <CardContent className="max-h-[50vh] overflow-y-auto p-4">
                              {renderSectionContent(section.id)}
                            </CardContent>
                            <CardFooter className="flex justify-between mt-4">
                              {!sectionsWithoutAddWithAI.has(section.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white hover:bg-gray-100"
                                  onClick={() => addWithAI(section.id)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add with AI
                                </Button>
                              )}
                              {/* Remove the Edit Section button */}
                            </CardFooter>
                          </Card>
                        </TabsContent>
                      ))}
                    </div>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-center mt-6">
                  <Badge variant="secondary" className="text-sm">
                    AI-powered avatar creation • Customizable sections • Instant PDF download
                  </Badge>
                </CardFooter>
              </Card>
            </motion.div>
          )}
          {showSnakeGame && (
            <SnakeGame onClose={() => setShowSnakeGame(false)} />
          )}
        </>
      ) : null}
    </div>
  );
}


and route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { section, avatarData } = await req.json();

    let prompt = `Given the following avatar data for a ${avatarData.details.career}:

${JSON.stringify(avatarData, null, 2)}

`;

    if (section === 'biggest-problem') {
      prompt += `Generate 3 new detailed problems (a mix of financial and emotional) for the "${section}" section. The response should be in the following JSON format:

[
  {
    "type": "financial",
    "problem": "Detailed financial problem"
  },
  {
    "type": "emotional",
    "problem": "Detailed emotional problem"
  },
  {
    "type": "financial",
    "problem": "Another detailed financial problem"
  }
]

Ensure the generated problems are relevant, detailed, and specific to the avatar's situation.`;
    } else {
      prompt += `Generate 3 new detailed main points with up to 3 subpoints each for the "${section}" section. The response should be in the following JSON format:

[
  {
    "main": "Main point 1",
    "subPoints": ["Subpoint 1", "Subpoint 2", "Subpoint 3"]
  },
  {
    "main": "Main point 2",
    "subPoints": ["Subpoint 1", "Subpoint 2"]
  },
  {
    "main": "Main point 3",
    "subPoints": ["Subpoint 1", "Subpoint 2", "Subpoint 3"]
  }
]

Ensure the generated points are relevant, detailed, and specific to the avatar's situation and the ${section} section.`;
    }

    prompt += " Provide ONLY the JSON array as the response, with no additional text.";

    const completion = await anthropic.completions.create({
      model: "claude-2",
      prompt: `Human: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 1000,
      stop_sequences: ["\nHuman:"],
    });

    let content = completion.completion.trim();
    if (!content) throw new Error('No content received from Anthropic');

    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in the API response');
    }

    content = jsonMatch[0];

    // Clean up the content to ensure it's valid JSON
    content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    content = content.replace(/^\s*\[/, '[').replace(/\]\s*$/, ']');

    let generatedPoints;
    try {
      generatedPoints = JSON.parse(content);
    } catch (jsonError) {
      console.error('Failed to parse JSON:', content);
      throw new Error(`Failed to parse JSON: ${jsonError.message}`);
    }

    if (!Array.isArray(generatedPoints)) {
      throw new Error('Generated content is not an array');
    }

    return NextResponse.json(generatedPoints);
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.status === 429) {
      return NextResponse.json({ error: 'API quota exceeded. Please check your Anthropic account.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to generate points', details: error.message }, { status: 500 });
  }
}


use what you need from these pages to make the avatar creator work again.
however, do keep the new logic we have for credit and stuff do not change anything with that.
only work the avatar-creator.tsx file, and the route.ts file.

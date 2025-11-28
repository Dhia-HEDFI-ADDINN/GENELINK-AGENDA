'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PhoneIcon,
  CalendarIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@pti-calendar/design-system';

interface Script {
  id: string;
  titre: string;
  categorie: 'PRISE_RDV' | 'CONFIRMATION' | 'ANNULATION' | 'RECLAMATION' | 'INFO_GENERALE' | 'URGENCE';
  description: string;
  etapes: Array<{
    id: string;
    ordre: number;
    titre: string;
    contenu: string;
    type: 'TEXTE' | 'QUESTION' | 'ACTION';
    options?: Array<{ label: string; next_step?: string }>;
  }>;
  tags: string[];
  updated_at: string;
}

interface FAQ {
  id: string;
  question: string;
  reponse: string;
  categorie: string;
  tags: string[];
}

export default function ScriptsPage() {
  const [activeTab, setActiveTab] = useState('scripts');
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchFaq, setSearchFaq] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');

  // Fetch scripts
  const { data: scripts, isLoading: scriptsLoading } = useQuery({
    queryKey: ['scripts', filterCategorie],
    queryFn: async () => {
      const response = await api.get<{ data: Script[] }>('/callcenter/scripts', {
        params: { categorie: filterCategorie || undefined },
      });
      return response.data.data;
    },
  });

  // Fetch FAQ
  const { data: faqs, isLoading: faqsLoading } = useQuery({
    queryKey: ['faqs', searchFaq],
    queryFn: async () => {
      const response = await api.get<{ data: FAQ[] }>('/callcenter/faq', {
        params: { search: searchFaq || undefined },
      });
      return response.data.data;
    },
  });

  const getCategoryIcon = (categorie: string) => {
    switch (categorie) {
      case 'PRISE_RDV':
        return <CalendarIcon className="h-5 w-5" />;
      case 'CONFIRMATION':
        return <PhoneIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (categorie: string) => {
    const labels: Record<string, string> = {
      PRISE_RDV: 'Prise de RDV',
      CONFIRMATION: 'Confirmation',
      ANNULATION: 'Annulation',
      RECLAMATION: 'Réclamation',
      INFO_GENERALE: 'Information',
      URGENCE: 'Urgence',
    };
    return labels[categorie] || categorie;
  };

  const getCategoryColor = (categorie: string) => {
    const colors: Record<string, string> = {
      PRISE_RDV: 'bg-green-100 text-green-700',
      CONFIRMATION: 'bg-blue-100 text-blue-700',
      ANNULATION: 'bg-red-100 text-red-700',
      RECLAMATION: 'bg-orange-100 text-orange-700',
      INFO_GENERALE: 'bg-gray-100 text-gray-700',
      URGENCE: 'bg-red-100 text-red-700',
    };
    return colors[categorie] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scripts & FAQ</h1>
        <p className="text-gray-500 mt-1">Guides d'appel et réponses aux questions fréquentes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scripts">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Scripts d'appel
          </TabsTrigger>
          <TabsTrigger value="faq">
            <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
            FAQ
          </TabsTrigger>
        </TabsList>

        {/* Scripts Tab */}
        <TabsContent value="scripts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scripts List */}
            <div className="space-y-4">
              {/* Filter */}
              <Card>
                <CardContent className="p-4">
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={filterCategorie}
                    onChange={(e) => setFilterCategorie(e.target.value)}
                  >
                    <option value="">Toutes les catégories</option>
                    <option value="PRISE_RDV">Prise de RDV</option>
                    <option value="CONFIRMATION">Confirmation</option>
                    <option value="ANNULATION">Annulation</option>
                    <option value="RECLAMATION">Réclamation</option>
                    <option value="INFO_GENERALE">Information générale</option>
                    <option value="URGENCE">Urgence</option>
                  </select>
                </CardContent>
              </Card>

              {/* Scripts */}
              {scriptsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : scripts && scripts.length > 0 ? (
                <div className="space-y-2">
                  {scripts.map((script) => (
                    <Card
                      key={script.id}
                      className={`cursor-pointer transition-colors ${
                        selectedScript?.id === script.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedScript(script);
                        setCurrentStep(0);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${getCategoryColor(script.categorie)}`}>
                              {getCategoryIcon(script.categorie)}
                            </div>
                            <div>
                              <p className="font-medium">{script.titre}</p>
                              <p className="text-sm text-gray-500 mt-1">{script.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {script.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="valide" size="sm">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    Aucun script disponible
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Script Detail */}
            <div className="lg:col-span-2">
              {selectedScript ? (
                <Card>
                  <CardHeader className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="en_attente">{getCategoryLabel(selectedScript.categorie)}</Badge>
                      </div>
                      <h2 className="text-xl font-bold">{selectedScript.titre}</h2>
                      <p className="text-gray-500 mt-1">{selectedScript.description}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentStep(0)}>
                      Recommencer
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {/* Progress */}
                    <div className="flex items-center gap-2 mb-6">
                      {selectedScript.etapes.map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 flex-1 rounded-full ${
                            index <= currentStep ? 'bg-primary-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Current Step */}
                    {selectedScript.etapes[currentStep] && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>Étape {currentStep + 1} / {selectedScript.etapes.length}</span>
                          <Badge variant={
                            selectedScript.etapes[currentStep].type === 'QUESTION' ? 'rappele' :
                            selectedScript.etapes[currentStep].type === 'ACTION' ? 'confirme' : 'en_attente'
                          }>
                            {selectedScript.etapes[currentStep].type}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-semibold">
                          {selectedScript.etapes[currentStep].titre}
                        </h3>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="whitespace-pre-wrap text-gray-700">
                            {selectedScript.etapes[currentStep].contenu}
                          </p>
                        </div>

                        {/* Options */}
                        {selectedScript.etapes[currentStep].options && (
                          <div className="space-y-2 mt-4">
                            <p className="text-sm font-medium text-gray-700">Réponses possibles :</p>
                            {selectedScript.etapes[currentStep].options!.map((option, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                  if (option.next_step) {
                                    const nextIndex = selectedScript.etapes.findIndex(e => e.id === option.next_step);
                                    if (nextIndex !== -1) setCurrentStep(nextIndex);
                                  } else {
                                    setCurrentStep(currentStep + 1);
                                  }
                                }}
                              >
                                <ChevronRightIcon className="h-4 w-4 mr-2" />
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0}
                          >
                            Précédent
                          </Button>
                          <Button
                            onClick={() => setCurrentStep(Math.min(selectedScript.etapes.length - 1, currentStep + 1))}
                            disabled={currentStep === selectedScript.etapes.length - 1}
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Sélectionnez un script pour commencer</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="mt-6 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <Input
                placeholder="Rechercher dans la FAQ..."
                value={searchFaq}
                onChange={(e) => setSearchFaq(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              />
            </CardContent>
          </Card>

          {/* FAQ List */}
          {faqsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : faqs && faqs.length > 0 ? (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <FAQItem key={faq.id} faq={faq} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                {searchFaq ? 'Aucun résultat pour cette recherche' : 'Aucune FAQ disponible'}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Reference Card */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Informations utiles</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-800">Horaires d'ouverture</p>
              <p className="text-blue-600">Lun-Ven: 8h-18h</p>
              <p className="text-blue-600">Sam: 8h-12h</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">Tarifs standards</p>
              <p className="text-green-600">CT VL: 79,90€</p>
              <p className="text-green-600">Contre-visite: 19,90€</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="font-medium text-orange-800">Délais</p>
              <p className="text-orange-600">Annulation: 24h avant</p>
              <p className="text-orange-600">Contre-visite: 2 mois</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FAQItem({ faq }: { faq: FAQ }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-0">
        <button
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <QuestionMarkCircleIcon className="h-5 w-5 text-primary-500" />
            <span className="font-medium">{faq.question}</span>
          </div>
          {isOpen ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>
        {isOpen && (
          <div className="px-4 pb-4 pt-0">
            <div className="p-4 bg-gray-50 rounded-lg ml-8">
              <p className="text-gray-700 whitespace-pre-wrap">{faq.reponse}</p>
            </div>
            <div className="flex flex-wrap gap-1 mt-3 ml-8">
              <Badge variant="en_attente" size="sm">{faq.categorie}</Badge>
              {faq.tags.map((tag) => (
                <Badge key={tag} variant="valide" size="sm">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

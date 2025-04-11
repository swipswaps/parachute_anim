import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

/**
 * Language selector component
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant
 * @param {string} props.size - Button size
 * @param {string} props.className - Additional CSS classes
 */
export default function LanguageSelector({
  variant = 'ghost',
  size = 'sm',
  className = '',
}) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Available languages
  const languages = [
    { code: 'en', name: t('languages.en') },
    { code: 'fr', name: t('languages.fr') },
    { code: 'es', name: t('languages.es') },
    { code: 'de', name: t('languages.de') },
    { code: 'ja', name: t('languages.ja') },
  ];

  // Current language
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Change language
  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`flex items-center ${className}`}
          aria-label={t('common.language')}
        >
          <Globe className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer ${
              language.code === i18n.language ? 'font-bold bg-gray-100' : ''
            }`}
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

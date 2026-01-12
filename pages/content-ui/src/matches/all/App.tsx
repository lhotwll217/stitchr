import { useEffect, useState } from 'react';
import type { VocabularyItem } from '@src/vocabulary';

const STORAGE_KEY = 'vocabulary-storage-key';

export default function App() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);

  useEffect(() => {
    console.log('[CEB] Word replacement content UI loaded');

    // Load vocabulary from Chrome storage
    const loadVocabulary = () => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(STORAGE_KEY, result => {
          const stored = result[STORAGE_KEY];
          if (Array.isArray(stored) && stored.length > 0) {
            const active = stored.filter((item: VocabularyItem) => item.enabled !== false);
            console.log('[CEB] Loaded vocabulary from storage:', active.length, 'active items');
            setVocabulary(active);
          } else {
            console.log('[CEB] No vocabulary in storage');
            setVocabulary([]);
          }
        });
      } else {
        console.warn('[CEB] Chrome storage not available');
      }
    };

    loadVocabulary();

    // Listen for storage changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        console.log('[CEB] Vocabulary changed in storage, reloading...');
        loadVocabulary();
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  // Process vocabulary when it changes
  useEffect(() => {
    if (vocabulary.length === 0) {
      console.log('[CEB] No vocabulary to process');
      return;
    }

    console.log(
      `[CEB] Processing ${vocabulary.length} vocabulary items:`,
      vocabulary.map(v => `"${v.from}" → "${v.to}"`).join(', ')
    );

    // Clear existing chips first
    const existingChips = document.querySelectorAll('.ceb-word-chip');
    existingChips.forEach(chip => {
      const original = chip.getAttribute('data-original');
      if (original && chip.parentNode) {
        const textNode = document.createTextNode(original);
        chip.parentNode.replaceChild(textNode, chip);
      }
    });

    // Ensure overlay exists
    let overlay = document.getElementById('ceb-translation-overlay') as HTMLDivElement | null;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ceb-translation-overlay';
      overlay.style.cssText = 'position:fixed;inset:0 0 auto 0;pointer-events:none;z-index:2147483647;';
      document.body.appendChild(overlay);
    }

    // Build regex pattern
    const words = vocabulary.map(item => item.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const patternSource = `\\b(${words.join('|')})\\b(?![a-zA-Z])`;
    const testPattern = new RegExp(patternSource, 'i');
    const createMatchPattern = () => new RegExp(patternSource, 'gi');

    // Vocab lookup map
    const vocabMap = new Map<string, VocabularyItem>();
    vocabulary.forEach(item => vocabMap.set(item.from.toLowerCase(), item));

    const createChip = (originalWord: string, vocabItem: VocabularyItem) => {
      const chip = document.createElement('span');
      chip.className = 'ceb-word-chip';
      chip.textContent = vocabItem.to;
      chip.setAttribute('data-original', originalWord);
      chip.style.cssText = `
        display:inline-flex;align-items:center;padding:2px 8px;margin:0 2px;
        background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
        color:white;border-radius:6px;font-size:0.875em;font-weight:500;
        box-shadow:0 2px 4px rgba(0,0,0,0.1);cursor:help;
      `;

      const tooltip = document.createElement('div');
      tooltip.innerHTML = `
        <div style="font-weight:600;margin-bottom:8px;font-size:11px;color:#a78bfa;">
          ${vocabItem.fromLang} → ${vocabItem.toLang}
        </div>
        <div style="font-size:14px;display:flex;align-items:center;gap:10px;">
          <span>"${originalWord}"</span>
          <span>→</span>
          <span style="padding:4px 12px;border-radius:6px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;font-weight:600;">"${vocabItem.to}"</span>
        </div>
      `;
      tooltip.style.cssText = `
        position:fixed;transform:translateX(-50%) translateY(-100%);
        background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);
        color:white;padding:14px 20px;border-radius:8px;font-size:14px;
        white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.4);
        opacity:0;pointer-events:none;z-index:2147483647;
        border:1px solid rgba(167,139,250,0.3);
      `;

      chip.addEventListener('mouseenter', () => {
        const rect = chip.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 8}px`;
        overlay!.appendChild(tooltip);
        tooltip.style.opacity = '1';
      });
      chip.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        tooltip.remove();
      });

      return chip;
    };

    const findAndReplaceWords = () => {
      // Collect all text nodes that contain vocabulary words
      const textNodesToProcess: Text[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: node => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'input', 'textarea'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          if (
            parent.closest('#CEB-extension-all') ||
            parent.closest('#ceb-translation-overlay') ||
            parent.closest('.ceb-word-chip') ||
            parent.isContentEditable
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          if (node.textContent && testPattern.test(node.textContent)) {
            return NodeFilter.FILTER_ACCEPT;
          }

          return NodeFilter.FILTER_REJECT;
        },
      });

      let node: Node | null;
      while ((node = walker.nextNode())) {
        textNodesToProcess.push(node as Text);
      }

      let totalReplacements = 0;

      // Process each text node - replace ALL matches within it
      textNodesToProcess.forEach(textNode => {
        const parent = textNode.parentNode;
        if (!parent) return;

        const text = textNode.textContent || '';
        const regex = createMatchPattern();

        // Find all matches with their positions
        const matches: { word: string; index: number; vocabItem: VocabularyItem }[] = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
          const vocabItem = vocabMap.get(match[1].toLowerCase());
          if (vocabItem) {
            matches.push({ word: match[1], index: match.index, vocabItem });
          }
        }

        if (matches.length === 0) return;

        // Build new nodes: text, chip, text, chip, text...
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        matches.forEach(({ word, index, vocabItem }) => {
          // Add text before this match
          if (index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, index)));
          }
          // Add the chip
          fragment.appendChild(createChip(word, vocabItem));
          lastIndex = index + word.length;
          totalReplacements++;
        });

        // Add remaining text after last match
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        // Replace the original text node with our fragment
        parent.replaceChild(fragment, textNode);
      });

      console.log(`[CEB] Replaced ${totalReplacements} words in ${textNodesToProcess.length} text nodes`);
    };

    findAndReplaceWords();

    // Watch for DOM changes
    const observer = new MutationObserver(mutations => {
      let shouldReplace = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (
              node instanceof Element &&
              !node.closest('.ceb-word-chip') &&
              !node.closest('#ceb-translation-overlay')
            ) {
              shouldReplace = true;
            }
          });
        }
      });
      if (shouldReplace) {
        setTimeout(findAndReplaceWords, 100);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [vocabulary]);

  return <div style={{ display: 'none' }} data-word-replacer="active" />;
}

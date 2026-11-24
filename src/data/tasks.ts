import { Task } from '../types';

export const TASKS: Task[] = [
  {
    id: 'task-1',
    slug: 'numpy-minmax-scaling',
    title: 'Normalizacja Min-Max i Broadcasting w NumPy',
    module: 'Moduł 1: Fundamenty NumPy & Sieci Neuronowe',
    category: 'NumPy & Analiza Danych',
    difficulty: 'Łatwy',
    estimatedMinutes: 10,
    requiredSymbols: ['min_max_scale'],
    summary: 'Zaimplementuj skalowanie cech do zadanego zakresu z poprawnym dopasowaniem osi i zabezpieczeniem przed dzieleniem przez zero.',
    descriptionMarkdown: `### 🎯 Cel Zadania
Przetwarzanie wstępne danych (preprocessing) to fundament każdego potoku uczenia maszynowego. W tym zadaniu zaimplementujesz funkcję **skalowania cech min-max** (ang. *Min-Max Normalization*) wyłącznie przy użyciu biblioteki \`NumPy\`.

### 📐 Formuła Matematyczna
Dla macierzy danych $X \\in \\mathbb{R}^{N \\times D}$, gdzie $N$ to liczba próbek, a $D$ to liczba cech:
$$X_{scaled} = \\frac{X - X_{min}}{X_{max} - X_{min}} \\cdot (max\\_val - min\\_val) + min\\_val$$

Gdzie:
- $X_{min}$ oraz $X_{max}$ to wektory zawierające odpowiednio minimalną i maksymalną wartość dla **każdej kolumny (cechy)** niezależnie.
- $min\\_val$ oraz $max\\_val$ to zadany zakres docelowy (domyślnie $[0, 1]$).

### ⚠️ Pułapki i Wymagania
1. **Oś operacji (axis):** Upewnij się, że statystyki liczone są wzdłuż właściwego wymiaru. Zastanów się: czy szukasz minimum dla każdej próbki (wiersza), czy dla każdej cechy (kolumny)?
2. **Broadcasting wymiarów:** Sprawdź, czy kształt wektorów $X_{min}$ i $X_{max}$ pozwala na bezpośrednie odjęcie od macierzy $X$ bez utraty wymiarów.
3. **Cechy o zerowej wariancji:** Jeśli cecha ma stałą wartość na całym zbiorze ($X_{max} == X_{min}$), dzielenie przez zero spowoduje pojawienie się wartości \`NaN\`. Zabezpiecz kod tak, aby w takim przypadku mianownik był traktowany jako $1.0$ (lub dodaj $\\epsilon = 1e-8$), a wynikowa cecha miała wartość $min\\_val$.
`,
    starterCode: `import numpy as np

def min_max_scale(X: np.ndarray, feature_range: tuple = (0, 1)) -> np.ndarray:
    """
    Skaluje cechy macierzy X (dwuwymiarowej) niezaleznie do zadanego zakresu feature_range.
    
    Parametry:
        X: np.ndarray o ksztalcie (N, D)
        feature_range: krotka (min_val, max_val), domyslnie (0, 1)
        
    Zwraca:
        np.ndarray o tym samym ksztalcie co X z wartosciami w zadanym zakresie.
    """
    min_val, max_val = feature_range
    
    # Krok 1: Oblicz minimum i maksimum dla kazdej cechy (kolumny)
    # UWAGA: zastanow sie nad wlasciwa osia (axis) i ksztaltem wyniku!
    x_min = X.min() # TODO: popraw wyznaczenie minimum per kolumna
    x_max = X.max() # TODO: popraw wyznaczenie maksimum per kolumna
    
    # Krok 2: Zabezpiecz przed dzieleniem przez zero dla stalych kolumn
    denominator = x_max - x_min
    
    # Krok 3: Dokonaj skalowania i zwroc wynik
    scaled = (X - x_min) / denominator * (max_val - min_val) + min_val
    return scaled
`,
    referenceSolution: `import numpy as np

def min_max_scale(X: np.ndarray, feature_range: tuple = (0, 1)) -> np.ndarray:
    min_val, max_val = feature_range
    x_min = np.min(X, axis=0, keepdims=True)
    x_max = np.max(X, axis=0, keepdims=True)
    
    diff = x_max - x_min
    # Bezpieczny mianownik: tam gdzie diff == 0, ustaw 1.0
    safe_diff = np.where(diff == 0, 1.0, diff)
    
    scaled = ((X - x_min) / safe_diff) * (max_val - min_val) + min_val
    # Gdy cecha byla stala, ustaw wartosc min_val
    scaled = np.where(diff == 0, min_val, scaled)
    return scaled
`,
    testSuiteCode: `
def run_all_tests():
    import numpy as np
    
    # Test 1: Standardowe skalowanie do [0, 1]
    X1 = np.array([
        [10.0, 200.0, 3.0],
        [20.0, 100.0, 1.0],
        [30.0, 300.0, 5.0]
    ])
    res1 = min_max_scale(X1, (0, 1))
    assert res1.shape == X1.shape, f"Oczekiwano ksztaltu {X1.shape}, otrzymano {res1.shape}"
    assert np.allclose(res1.min(axis=0), [0.0, 0.0, 0.0]), f"Minimum kolumn powinno wynosic 0.0, otrzymano {res1.min(axis=0)}"
    assert np.allclose(res1.max(axis=0), [1.0, 1.0, 1.0]), f"Maksimum kolumn powinno wynosic 1.0, otrzymano {res1.max(axis=0)}"
    __record_test__("test_standard_scaling", "Skalowanie macierzy 2D do zakresu [0, 1]", True)
    
    # Test 2: Skalowanie do niestandardowego zakresu [-1, 1]
    res2 = min_max_scale(X1, (-1, 1))
    assert np.allclose(res2.min(axis=0), [-1.0, -1.0, -1.0]), f"Minimum kolumn powinno wynosic -1.0, otrzymano {res2.min(axis=0)}"
    assert np.allclose(res2.max(axis=0), [1.0, 1.0, 1.0]), f"Maksimum kolumn powinno wynosic 1.0, otrzymano {res2.max(axis=0)}"
    __record_test__("test_custom_range", "Skalowanie do zakresu [-1, 1]", True)
    
    # Test 3: Weryfikacja osi kolumnowej (nie globalnej ani po wierszach)
    X3 = np.array([
        [1.0, 10.0],
        [2.0, 20.0],
        [3.0, 30.0]
    ])
    res3 = min_max_scale(X3, (0, 1))
    # Kazda kolumna powinna byc przeskalowana niezaleznie: [0, 0.5, 1.0]
    expected_col = np.array([[0.0, 0.0], [0.5, 0.5], [1.0, 1.0]])
    assert np.allclose(res3, expected_col), f"Niezgodnosc wartosci - sprawdz czy skalujesz po osi axis=0! Otrzymano:\\n{res3}"
    __record_test__("test_axis_independence", "Niezalezne skalowanie kolumn (axis=0)", True)
    
    # Test 4: Ochrona przed dzieleniem przez zero (stala kolumna)
    X4 = np.array([
        [5.0, 10.0],
        [5.0, 20.0],
        [5.0, 30.0]
    ])
    res4 = min_max_scale(X4, (0, 1))
    assert not np.isnan(res4).any(), "Wynik zawiera wartosci NaN przy kolumnie o stalej wartosci!"
    assert not np.isinf(res4).any(), "Wynik zawiera wartosci Inf przy kolumnie o stalej wartosci!"
    assert np.allclose(res4[:, 0], 0.0), f"Stala kolumna powinna miec wartosc min_val (0.0), otrzymano {res4[:, 0]}"
    __record_test__("test_zero_variance_protection", "Obsluga cech o stalej wartosci (brak NaN)", True)
`,
    commonErrors: [
      {
        pattern: "axis",
        level1Hint: "Zastanów się: co reprezentują wiersze, a co kolumny w macierzy cech X? Czy szukasz minimum dla pacjenta, czy dla cechy?",
        level2Hint: "Metoda `np.min()` domyślnie redukuje całą tablicę do pojedynczego skalara. Użyj parametru `axis=0`, aby obliczać statystyki wzdłuż wierszy dla każdej kolumny.",
        level3Hint: "Zastosuj `np.min(X, axis=0, keepdims=True)`. Flaga `keepdims=True` gwarantuje zachowanie kształtu (1, D), co ułatwia broadcasting z macierzą (N, D)."
      },
      {
        pattern: "nan",
        level1Hint: "Gdy w danych pojawi się kolumna, w której wszystkie wartości są równe, co stanie się z mianownikiem?",
        level2Hint: "Gdy `x_max == x_min`, ich różnica wynosi zero, powodując dzielenie 0/0 -> NaN.",
        level3Hint: "Użyj `np.where(diff == 0, 1.0, diff)` lub dodaj małe $\\epsilon = 1e-8$, aby mianownik nigdy nie był zerem."
      }
    ]
  },
  {
    id: 'task-2',
    slug: 'numpy-dense-layer',
    title: 'Warstwa Liniowa i Mnożenie Macierzy w NumPy',
    module: 'Moduł 1: Fundamenty NumPy & Sieci Neuronowe',
    category: 'Sieci Neuronowe',
    difficulty: 'Średniozaawansowany',
    estimatedMinutes: 15,
    requiredSymbols: ['DenseLayer'],
    summary: 'Zaimplementuj propagację w przód (forward pass) w pełnopołączonej warstwie gęstej (Dense Layer), unikając błędów niezgodności kształtów macierzy.',
    descriptionMarkdown: `### 🎯 Cel Zadania
Warstwa w pełni połączona (ang. *Dense* lub *Linear Layer*) to podstawowy klocek konstrukcyjny wielowarstwowych perceptronów (MLP) i transformatorów. W tym zadaniu zaimplementujesz klasę \`DenseLayer\` w czystym \`NumPy\`.

### 📐 Formuła Matematyczna
Dla partii danych wejściowych $X \\in \\mathbb{R}^{B \\times in\\_features}$ (gdzie $B$ to rozmiar batcha):
$$Z = X W + b$$

Gdzie:
- $W \\in \\mathbb{R}^{in\\_features \\times out\\_features}$ to macierz wag warstwy.
- $b \\in \\mathbb{R}^{out\\_features}$ (lub $\\mathbb{R}^{1 \\times out\\_features}$) to wektor obciążeń (*bias*).
- $Z \\in \\mathbb{R}^{B \\times out\\_features}$ to liniowa aktywacja wyjściowa przed funkcją nieliniową.

### ⚠️ Pułapki i Wymagania
1. **Niezgodność wymiarów (\`shapes not aligned\`):** Pamiętaj, że w iloczynie macierzowym $A \\times B$ liczba kolumn w $A$ musi być dokładnie równa liczbie wierszy w $B$.
2. **Operator mnożenia:** W Pythonie/NumPy operator \`*\` wykonuje mnożenie poelementowe (Hadamarda), które wymaga takich samych wymiarów lub broadcastingu! Do iloczynu macierzowego służy operator \`@\` lub \`np.dot()\`.
3. **Broadcasting wektora biasu:** Upewnij się, że wektor $b$ poprawnie dodaje się do każdego wiersza macierzy $X W$.
`,
    starterCode: `import numpy as np

class DenseLayer:
    def __init__(self, in_features: int, out_features: int):
        """
        Inicjalizuje wagi i obciazenia warstwy liniowej.
        """
        self.in_features = in_features
        self.out_features = out_features
        
        # Zainicjalizuj wagi z rozkladu normalnego pomnozone przez 0.01
        # UWAGA na kolejnosc wymiarow w macierzy wag!
        self.W = np.random.randn(out_features, in_features) * 0.01  # Czy wymiary sa poprawne?
        
        # Wektor obciazen zainicjalizowany zerami
        self.b = np.zeros((1, out_features))

    def forward(self, X: np.ndarray) -> np.ndarray:
        """
        Oblicza przejscie w przod: Z = X * W + b
        
        Parametry:
            X: macierz cech wejsciowych o ksztalcie (B, in_features)
            
        Zwraca:
            Z: macierz wyjsciowa o ksztalcie (B, out_features)
        """
        # TODO: Popraw mnozenie macierzowe i wymiary
        # Uwaga: zwroc uwage na uzycie operatora * vs @ oraz ewentualna transpozycje wag!
        Z = X * self.W + self.b
        return Z
`,
    referenceSolution: `import numpy as np

class DenseLayer:
    def __init__(self, in_features: int, out_features: int):
        self.in_features = in_features
        self.out_features = out_features
        # Wymiar wag: (in_features, out_features) dla Z = X @ W + b
        self.W = np.random.randn(in_features, out_features) * 0.01
        self.b = np.zeros((1, out_features))

    def forward(self, X: np.ndarray) -> np.ndarray:
        # Iloczyn macierzowy (B, in) @ (in, out) -> (B, out)
        Z = X @ self.W + self.b
        return Z
`,
    testSuiteCode: `
def run_all_tests():
    import numpy as np
    
    # Test 1: Weryfikacja wymiarow wag
    layer = DenseLayer(in_features=8, out_features=4)
    # Akceptujemy zarowno self.W o ksztalcie (8, 4), jak i (4, 8) jesli forward dokonuje transpozycji
    X_dummy = np.ones((16, 8))
    try:
        out_dummy = layer.forward(X_dummy)
    except Exception as e:
        raise AssertionError(f"Blad podczas forward(): {e}")
    assert out_dummy.shape == (16, 4), f"Oczekiwano wyjscia o ksztalcie (16, 4), otrzymano {out_dummy.shape}"
    __record_test__("test_output_shape", "Poprawny ksztalt tensora wyjsciowego (B, out_features)", True)
    
    # Test 2: Weryfikacja iloczynu macierzowego (a nie poelementowego)
    # Zdefiniujmy znane wagi
    layer_det = DenseLayer(in_features=2, out_features=3)
    layer_det.W = np.array([
        [1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0]
    ])
    layer_det.b = np.array([[0.1, 0.2, 0.3]])
    
    X_det = np.array([
        [1.0, 2.0],
        [0.0, 1.0]
    ])
    # Oczekiwane Z:
    # wiersz 1: [1*1 + 2*4, 1*2 + 2*5, 1*3 + 2*6] + [0.1, 0.2, 0.3] = [9.1, 12.2, 15.3]
    # wiersz 2: [0*1 + 1*4, 0*2 + 1*5, 0*3 + 1*6] + [0.1, 0.2, 0.3] = [4.1, 5.2, 6.3]
    expected_Z = np.array([
        [9.1, 12.2, 15.3],
        [4.1, 5.2, 6.3]
    ])
    res_det = layer_det.forward(X_det)
    assert np.allclose(res_det, expected_Z), f"Niezgodne wartosci obliczen liniowych! Otrzymano:\\n{res_det}\\nOczekiwano:\\n{expected_Z}"
    __record_test__("test_matrix_multiplication_values", "Dokladnosc obliczen iloczynu macierzowego z biasem", True)
    
    # Test 3: Weryfikacja roznych rozmiarow batcha (B=1, B=64)
    for b_size in [1, 7, 64]:
        X_b = np.random.randn(b_size, 8)
        out_b = layer.forward(X_b)
        assert out_b.shape == (b_size, 4), f"Niepoprawny ksztalt dla batcha {b_size}: {out_b.shape}"
    __record_test__("test_dynamic_batch_size", "Obsluga zmiennych rozmiarow batcha (B=1, 7, 64)", True)
`,
    commonErrors: [
      {
        pattern: "shapes not aligned",
        level1Hint: "Przypomnij sobie fundamentalną zasadę mnożenia macierzy: aby pomnożyć $A \\times B$, ile kolumn musi mieć macierz $A$ w odniesieniu do wierszy macierzy $B$?",
        level2Hint: "Macierz $X$ ma wymiary $(B, in\\_features)$. Jeśli twoje wagi mają wymiar $(out, in)$, nie możesz ich bezpośrednio pomnożyć $X @ W$.",
        level3Hint: "Zainicjalizuj wagi jako `np.random.randn(in_features, out_features)` LUB w metodzie forward wykonaj transpozycję: `X @ self.W.T`."
      },
      {
        pattern: "operands could not be broadcast",
        level1Hint: "Czy wiesz czym różni się operator `*` od operatora `@` w języku Python i bibliotece NumPy?",
        level2Hint: "Operator `*` to mnożenie poelementowe (element-wise). Do mnożenia macierzowego w algebrze liniowej służy operator `@`.",
        level3Hint: "Zastąp `X * self.W` wyrażeniem `X @ self.W`."
      }
    ]
  },
  {
    id: 'task-3',
    slug: 'numpy-stable-softmax',
    title: 'Numerycznie Stabilna Funkcja Softmax',
    module: 'Moduł 1: Fundamenty NumPy & Sieci Neuronowe',
    category: 'Matematyka ML',
    difficulty: 'Średniozaawansowany',
    estimatedMinutes: 15,
    requiredSymbols: ['stable_softmax'],
    summary: 'Zaimplementuj funkcję aktywacji Softmax odporną na przepełnienie zmiennoprzecinkowe (float overflow) dla dużych logitów.',
    descriptionMarkdown: `### 🎯 Cel Zadania
Funkcja **Softmax** przekształca wektor surowych wyników modelu (*logitów*) w dyskretny rozkład prawdopodobieństwa, którego suma wynosi dokładnie $1.0$. W praktycznych zastosowaniach naiwna implementacja powoduje jednak poważne błędy numeryczne (\`overflow in exp\` i wartości \`NaN\`).

### 📐 Formuła Matematyczna
Standardowa postać funkcji softmax dla wektora $z$:
$$\\sigma(z)_i = \\frac{e^{z_i}}{\\sum_{j=1}^{C} e^{z_j}}$$

W arytmetyce komputerowej (standard IEEE 754 float64) funkcja $e^x$ ulega przepełnieniu już dla $x \\approx 709$. Przykładowo dla wektora logitów $[1000, 1001, 1002]$ funkcja \`np.exp()\` zwróci \`[inf, inf, inf]\`, a dzielenie $\\frac{\\inf}{\\inf}$ da w rezultacie tablicę \`[nan, nan, nan]\`!

### 💡 Trik Numeryczny (Log-Sum-Exp Trick)
Zauważmy, że dla dowolnej stałej $C$:
$$\\frac{e^{z_i}}{\\sum_j e^{z_j}} = \\frac{e^{z_i - C}}{\\sum_j e^{z_j - C}}$$

Wybierając $C = \\max(z)$, największy wykładnik w potędze wyniesie dokładnie $e^0 = 1$, co całkowicie eliminuje ryzyko przepełnienia (*overflow*)!

### ⚠️ Pułapki i Wymagania
1. **Zabezpieczenie wymiarów (keepdims):** Podczas liczenia maksimum \`np.max(z, axis=-1)\` pamiętaj o zachowaniu wymiaru (\`keepdims=True\`), aby umożliwić poprawny broadcasting po ostatniej osi.
2. **Suma prawdopodobieństw:** Dla każdego wiersza suma wartości wyjściowych musi wynosić $1.0$ (z dokładnością do błędów zaokrągleń).
`,
    starterCode: `import numpy as np

def stable_softmax(logits: np.ndarray, axis: int = -1) -> np.ndarray:
    """
    Oblicza numerycznie stabilna funkcje softmax wzdluz podanej osi.
    
    Parametry:
        logits: np.ndarray o dowolnym ksztalcie (np. (B, C) lub (C,))
        axis: os wzdluz ktorej obliczany jest rozklad prawdopodobienstwa (domyslnie ostatnia: -1)
        
    Zwraca:
        np.ndarray o identycznym ksztalcie co logits, z wartosciami sumujacymi sie do 1.0.
    """
    # Krok 1: Wyznacz maksimum wzdluz zadanego axis
    # UWAGA: co stanie sie z ksztaltem jesli zapomnisz o parametrze keepdims?
    max_val = np.max(logits, axis=axis) # TODO: popraw wyznaczenie maksimum
    
    # Krok 2: Odejmij maksimum od logitow przed wywolaniem np.exp()
    shifted_logits = logits - max_val
    
    # Krok 3: Oblicz wykladnik exp
    exp_logits = np.exp(shifted_logits)
    
    # Krok 4: Znormalizuj przez sume exp wzdluz tego samego axis
    sum_exp = np.sum(exp_logits, axis=axis)
    
    return exp_logits / sum_exp
`,
    referenceSolution: `import numpy as np

def stable_softmax(logits: np.ndarray, axis: int = -1) -> np.ndarray:
    # Odejmujemy maksimum z keepdims=True, aby umozliwic broadcasting
    max_val = np.max(logits, axis=axis, keepdims=True)
    shifted = logits - max_val
    exp_logits = np.exp(shifted)
    sum_exp = np.sum(exp_logits, axis=axis, keepdims=True)
    return exp_logits / sum_exp
`,
    testSuiteCode: `
def run_all_tests():
    import numpy as np
    
    # Test 1: Podstawowe wlasnosci prawdopodobienstwa (suma = 1.0)
    z1 = np.array([2.0, 1.0, 0.1])
    probs1 = stable_softmax(z1)
    assert np.isclose(probs1.sum(), 1.0), f"Suma prawdopodobienstw powinna wynosic 1.0, otrzymano {probs1.sum()}"
    assert (probs1 >= 0).all() and (probs1 <= 1).all(), "Wszystkie prawdopodobienstwa musza lezec w [0, 1]"
    __record_test__("test_probability_distribution", "Wlasnosci rozkladu prawdopodobienstwa (suma=1.0, wartosci w [0, 1])", True)
    
    # Test 2: Stabilnosc numeryczna dla ekstremalnie wielkich logitow (> 1000)
    z_huge = np.array([1000.0, 1001.0, 1002.0])
    probs_huge = stable_softmax(z_huge)
    assert not np.isnan(probs_huge).any(), "Funkcja zwrocila NaN dla duzych logitow! Trik stabilnosci nie dziala."
    assert not np.isinf(probs_huge).any(), "Funkcja zwrocila Inf dla duzych logitow!"
    assert np.isclose(probs_huge.sum(), 1.0), f"Suma dla duzych logitow powinna wynosic 1.0, otrzymano {probs_huge.sum()}"
    __record_test__("test_numerical_stability_large", "Brak przepelnienia (overflow) dla duzych logitow (>= 1000)", True)
    
    # Test 3: Wymiary wielowymiarowe 2D (B, Classes)
    z_2d = np.array([
        [1.0, 2.0, 3.0],
        [100.0, 200.0, 300.0],
        [-10.0, -20.0, -30.0]
    ])
    probs_2d = stable_softmax(z_2d, axis=-1)
    assert probs_2d.shape == z_2d.shape, f"Oczekiwano ksztaltu {z_2d.shape}, otrzymano {probs_2d.shape}"
    sums = probs_2d.sum(axis=-1)
    assert np.allclose(sums, np.ones(3)), f"Suma w kazdym wierszu powinna wynosic 1.0, otrzymano {sums}"
    __record_test__("test_multidimensional_batch", "Obsluga macierzy wielowymiarowych (B, Classes) z axis=-1", True)
`,
    commonErrors: [
      {
        pattern: "operands could not be broadcast",
        level1Hint: "Gdy wywołujesz `np.max()` lub `np.sum()`, tablica traci wymiar, wzdłuż którego nastąpiła redukcja. Jak wpływa to na późniejsze odejmowanie i dzielenie?",
        level2Hint: "Dla macierzy o kształcie `(3, 4)`, operacja `np.max(logits, axis=-1)` zwraca wektor o kształcie `(3,)`, którego nie da się bezpośrednio podzielić z macierzą.",
        level3Hint: "Dodaj parametr `keepdims=True` do wywołań `np.max()` oraz `np.sum()`, aby zachować kształt `(3, 1)`."
      },
      {
        pattern: "overflow in exp",
        level1Hint: "Czy wiesz dlaczego funkcja `np.exp()` zgłasza błąd ostrzeżenia przy wartościach rzędu setek lub tysięcy?",
        level2Hint: "Przesuń logity odejmując od nich ich maksymalną wartość przed podniesieniem do potęgi.",
        level3Hint: "Zastosuj tożsamość: `shifted = logits - np.max(logits, axis=axis, keepdims=True)`, a następnie dopiero `np.exp(shifted)`."
      }
    ]
  },
  {
    id: 'task-4',
    slug: 'sklearn-pipeline-leakage',
    title: 'Scikit-Learn Pipeline & Zapobieganie Data Leakage',
    module: 'Moduł 2: Scikit-Learn & Optymalizacja ML',
    category: 'Scikit-Learn',
    difficulty: 'Średniozaawansowany',
    estimatedMinutes: 15,
    requiredSymbols: ['build_and_evaluate_pipeline'],
    summary: 'Zbuduj potok uczenia maszynowego w scikit-learn, chroniąc model przed wyciekiem danych (data leakage) ze zbioru testowego.',
    descriptionMarkdown: `### 🎯 Cel Zadania
Jednym z najczęstszych i najbardziej podstępnych błędów w inżynierii danych jest **wyciek danych** (ang. *Data Leakage*). Polega on na nieświadomym wykorzystaniu informacji ze zbioru testowego podczas trenowania modelu lub przygotowywania danych (np. obliczanie średniej i odchylenia do skalowania przed podziałem na train i test).

W tym zadaniu zaimplementujesz funkcję \`build_and_evaluate_pipeline()\`, wykorzystującą narzędzie \`Pipeline\` z biblioteki \`scikit-learn\`.

### 🛠️ Kroki Realizacji
1. **Podział danych:** Podziel wejściowe zbiory $X$ oraz $y$ na część treningową i testową za pomocą \`train_test_split\`:
   - \`test_size = 0.25\`
   - \`random_state = 42\`
2. **Budowa potoku (Pipeline):** Zbuduj \`Pipeline\` zawierający dokładnie dwa kroki:
   - Krok 1: \`"scaler"\` -> instancja \`StandardScaler()\`
   - Krok 2: \`"classifier"\` -> instancja \`LogisticRegression(max_iter=500, random_state=42)\`
3. **Dopasowanie modelu:** Dopasuj potok **wyłącznie** na danych treningowych (\`X_train\`, \`y_train\`).
4. **Ewaluacja:** Dokonaj predykcji na zbiorze testowym (\`X_test\`) i oblicz metryki:
   - \`accuracy\`: za pomocą \`accuracy_score\`
   - \`f1\`: za pomocą \`f1_score(..., average="macro")\`
5. **Wynik:** Zwróć słownik w formacie:
   \`{"pipeline": pipeline, "accuracy": acc, "f1": f1, "y_pred": y_pred}\`

### ⚠️ Kardynalna Zasada
Nigdy nie wywołuj metody \`fit\` ani \`fit_transform\` na danych testowych! Potok \`Pipeline\` automatycznie dba o to, aby metoda \`predict()\` używała parametrów (średniej i wariancji) nauczonych wyłącznie ze zbioru treningowego.
`,
    starterCode: `from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score
import numpy as np

def build_and_evaluate_pipeline(X: np.ndarray, y: np.ndarray) -> dict:
    """
    Dzieli dane, tworzy potok z poprawnym skalowaniem bez data leakage i ewaluuje model.
    """
    # KROK BŁĘDNY w kodzie startowym:
    # Ktoś wykonał skalowanie CAŁOŚCI danych PRZED podziałem train/test!
    # To jest podręcznikowy Data Leakage!
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X) # BŁĄD ARCHITEKTONICZNY!
    
    # Podział na train i test
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.25, random_state=42
    )
    
    # Model bez potoku
    model = LogisticRegression(max_iter=500, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro")
    
    # TODO: Zrefaktoryzuj ten kod, aby uzyc sklearn.pipeline.Pipeline
    # i uniknac skalowania przed podzialem train/test!
    return {
        "pipeline": model, # Zastap poprawnym obiektem Pipeline
        "accuracy": acc,
        "f1": f1,
        "y_pred": y_pred
    }
`,
    referenceSolution: `from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score
import numpy as np

def build_and_evaluate_pipeline(X: np.ndarray, y: np.ndarray) -> dict:
    # 1. Najpierw podzial surowych danych
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42
    )
    
    # 2. Tworzenie potoku Pipeline
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=500, random_state=42))
    ])
    
    # 3. Trening potoku TYLKO na zbiorze treningowym
    pipeline.fit(X_train, y_train)
    
    # 4. Ewaluacja na zbiorze testowym
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro")
    
    return {
        "pipeline": pipeline,
        "accuracy": float(acc),
        "f1": float(f1),
        "y_pred": y_pred
    }
`,
    testSuiteCode: `
def run_all_tests():
    import numpy as np
    from sklearn.datasets import make_classification
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler
    from sklearn.linear_model import LogisticRegression
    
    # Wygenerujmy deterministyczny zbiór danych
    X, y = make_classification(
        n_samples=200, n_features=10, n_classes=2, random_state=42
    )
    
    result = build_and_evaluate_pipeline(X, y)
    
    # Test 1: Zwrocony obiekt jest instancja Pipeline
    pipe = result.get("pipeline")
    assert isinstance(pipe, Pipeline), f"Oczekiwano obiektu sklearn.pipeline.Pipeline, otrzymano: {type(pipe)}"
    __record_test__("test_is_pipeline", "Zwrócenie poprawnego potoku sklearn.pipeline.Pipeline", True)
    
    # Test 2: Sprawdzenie krokow w Pipeline
    step_names = [name for name, _ in pipe.steps]
    assert "scaler" in step_names, f"Brak kroku 'scaler' w potoku! Kiedy sa: {step_names}"
    assert "classifier" in step_names, f"Brak kroku 'classifier' w potoku! Kiedy sa: {step_names}"
    assert isinstance(pipe.named_steps["scaler"], StandardScaler), "Krok 'scaler' powinien byc instancja StandardScaler"
    assert isinstance(pipe.named_steps["classifier"], LogisticRegression), "Krok 'classifier' powinien byc instancja LogisticRegression"
    __record_test__("test_pipeline_steps", "Kroki potoku: 'scaler' (StandardScaler) i 'classifier' (LogisticRegression)", True)
    
    # Test 3: Weryfikacja braku Data Leakage (scaler wytrenowany tylko na 150 probkach, bo 200 * 0.75 = 150)
    scaler = pipe.named_steps["scaler"]
    assert hasattr(scaler, "n_samples_seen_"), "Scaler nie zostal wytrenowany!"
    assert scaler.n_samples_seen_ == 150, f"DATA LEAKAGE! Scaler przetworzyl {scaler.n_samples_seen_} probek zamiast 150 probek treningowych!"
    __record_test__("test_no_data_leakage", "Weryfikacja braku wycieku danych (n_samples_seen == 150)", True)
    
    # Test 4: Weryfikacja metryk
    acc = result.get("accuracy")
    f1 = result.get("f1")
    assert isinstance(acc, (float, np.floating)) and 0.0 <= acc <= 1.0, f"Niepoprawna wartosc accuracy: {acc}"
    assert isinstance(f1, (float, np.floating)) and 0.0 <= f1 <= 1.0, f"Niepoprawna wartosc f1: {f1}"
    assert acc > 0.75, f"Zbyt niska dokladnosc modelu: {acc}"
    __record_test__("test_metric_values", "Weryfikacja poprawnosci i zakresu metryk accuracy oraz f1", True)
`,
    commonErrors: [
      {
        pattern: "DATA LEAKAGE",
        level1Hint: "Zastanów się: co to jest wyciek danych? Czy średnia liczona z całego zbioru (przed podziałem) może 'zdradzić' modelowi rozkład danych testowych?",
        level2Hint: "Podziel surowe macierze $X$ oraz $y$ na $X_{train}, X_{test}$ w pierwszej kolejności, zanim przekażesz je do jakiegokolwiek algorytmu skalowania.",
        level3Hint: "Zbuduj potok `Pipeline([('scaler', StandardScaler()), ('classifier', LogisticRegression(...))])` i wywołaj `pipeline.fit(X_train, y_train)`."
      },
      {
        pattern: "isinstance",
        level1Hint: "Sprawdź, jaki typ obiektu zwracasz w słowniku pod kluczem 'pipeline'.",
        level2Hint: "Funkcja powinna zwracać obiekt `Pipeline` ze Scikit-Learn łączący kroki preprocessingu i klasyfikacji.",
        level3Hint: "Zaimportuj `from sklearn.pipeline import Pipeline` i przekaż listę krotek `[('scaler', ...), ('classifier', ...)]`."
      }
    ]
  },
  {
    id: 'task-5',
    slug: 'numpy-gradient-descent',
    title: 'Krok Gradient Descent dla Regresji Liniowej w NumPy',
    module: 'Moduł 2: Scikit-Learn & Optymalizacja ML',
    category: 'Optymalizacja',
    difficulty: 'Zaawansowany',
    estimatedMinutes: 20,
    requiredSymbols: ['gradient_descent_step'],
    summary: 'Wyprowadź wektorowe pochodne cząstkowe błędu średniokwadratowego (MSE) i zaimplementuj krok algorytmu spadku wzdłuż gradientu.',
    descriptionMarkdown: `### 🎯 Cel Zadania
Algorytm spadku wzdłuż gradientu (ang. *Gradient Descent*) stanowi serce uczenia sieci neuronowych i modeli liniowych. W tym zadaniu zaimplementujesz pojedynczy krok optymalizacyjny dla modelu regresji liniowej w oparciu o wektoryzację w bibliotece \`NumPy\`.

### 📐 Wyprowadzenie Matematyczne
Dla macierzy cech $X \\in \\mathbb{R}^{N \\times D}$, wektora etykiet $y \\in \\mathbb{R}^{N}$, wektora wag $w \\in \\mathbb{R}^{D}$ i biasu $b \\in \\mathbb{R}$:
1. **Predykcja liniowa:**
   $$\\hat{y} = X w + b$$
2. **Wektor błędu residuów:**
   $$e = \\hat{y} - y$$
3. **Funkcja straty MSE (Mean Squared Error):**
   $$J(w, b) = \\frac{1}{2N} \\sum_{i=1}^{N} (\\hat{y}_i - y_i)^2$$
4. **Pochodne cząstkowe (gradienty):**
   $$\\frac{\\partial J}{\\partial w} = \\frac{1}{N} X^T e$$
   $$\\frac{\\partial J}{\\partial b} = \\frac{1}{N} \\sum_{i=1}^{N} e_i$$
5. **Reguła aktualizacji parametrów:**
   $$w \\leftarrow w - \\alpha \\cdot \\frac{\\partial J}{\\partial w}$$
   $$b \\leftarrow b - \\alpha \\cdot \\frac{\\partial J}{\\partial b}$$
   gdzie $\\alpha$ to współczynnik uczenia (*learning rate*).

### ⚠️ Pułapki i Wymagania
1. **Znak aktualizacji:** Ponieważ chcemy **zminimalizować** funkcję straty, przesuwamy wagi w stronę **przeciwną** do gradientu (odejmowanie, a nie dodawanie).
2. **Kształty tensorów:** Uważaj, aby $y$ oraz $\\hat{y}$ miały ten sam kształt (np. wektory 1D o długości $N$ lub kolumnowe $(N, 1)$). Mnożenie wektora 1D z 2D w NumPy może niepostrzeżenie stworzyć macierz $N \\times N$!
3. **Dzielenie przez $N$:** Pamiętaj o podzieleniu sumy gradientów przez liczbę próbek $N$, inaczej krok będzie rósł proporcjonalnie do wielkości zbioru danych.
`,
    starterCode: `import numpy as np

def gradient_descent_step(
    X: np.ndarray, 
    y: np.ndarray, 
    w: np.ndarray, 
    b: float, 
    learning_rate: float = 0.01
) -> tuple[np.ndarray, float, float]:
    """
    Wykonuje pojedynczy krok aktualizacji wag i biasu w regresji liniowej (MSE).
    
    Parametry:
        X: macierz (N, D)
        y: wektor etykiet (N,) lub (N, 1)
        w: wektor wag (D,) lub (D, 1)
        b: skalar biasu
        learning_rate: wspolczynnik uczenia alpha
        
    Zwraca:
        (new_w, new_b, current_loss)
    """
    N = X.shape[0]
    
    # Krok 1: Wyznacz predykcje y_hat
    y_hat = X @ w + b
    
    # Upewnij sie, ze wektory y i y_hat maja ten sam ksztalt 1D
    y_flat = y.reshape(-1)
    y_hat_flat = y_hat.reshape(-1)
    
    # Krok 2: Oblicz wektor bledu e = y_hat - y
    error = y_hat_flat - y_flat
    
    # Krok 3: Oblicz aktualny blad MSE
    loss = 0.5 * np.mean(error ** 2)
    
    # Krok 4: Oblicz gradienty dw oraz db
    # TODO: Popraw obliczenie gradientow i uzyj wlasciwej transpozycji
    dw = X.T @ error  # Czego tutaj brakuje?
    db = np.sum(error)  # Czego tutaj brakuje?
    
    # Krok 5: Zaktualizuj parametry w oraz b
    # UWAGA: czy przesuwamy sie w kierunku gradientu czy w kierunku przeciwnym?
    new_w = w + learning_rate * dw  # TODO: sprawdz znak aktualizacji
    new_b = b + learning_rate * db  # TODO: sprawdz znak aktualizacji
    
    return new_w, float(new_b), float(loss)
`,
    referenceSolution: `import numpy as np

def gradient_descent_step(
    X: np.ndarray, 
    y: np.ndarray, 
    w: np.ndarray, 
    b: float, 
    learning_rate: float = 0.01
) -> tuple[np.ndarray, float, float]:
    N = X.shape[0]
    
    # Splaszczamy do 1D w celu bezpiecznych operacji wektorowych
    w_flat = w.reshape(-1)
    y_flat = y.reshape(-1)
    
    # Predykcja
    y_hat = (X @ w_flat) + b
    error = y_hat - y_flat
    
    # Funkcja straty MSE
    loss = 0.5 * np.mean(error ** 2)
    
    # Gradienty znormalizowane przez liczbe probek N
    dw = (X.T @ error) / N
    db = float(np.sum(error) / N)
    
    # Aktualizacja ze znakiem MINUS (minimalizacja bledu)
    new_w = w_flat - learning_rate * dw
    new_b = b - learning_rate * db
    
    # Przywracamy oryginalny ksztalt wag jesli byl 2D
    if w.ndim == 2:
        new_w = new_w.reshape(w.shape)
        
    return new_w, float(new_b), float(loss)
`,
    testSuiteCode: `
def run_all_tests():
    import numpy as np
    
    # Dane testowe (liniowa zaleznosc y = 2*x1 + 3*x2 + 4)
    np.random.seed(42)
    N = 100
    X = np.random.randn(N, 2)
    true_w = np.array([2.0, 3.0])
    true_b = 4.0
    y = X @ true_w + true_b
    
    # Startujemy z losowymi wagami
    w_init = np.array([0.0, 0.0])
    b_init = 0.0
    
    # Test 1: Pojedynczy krok powinien zmniejszyc blad (loss)
    w_next, b_next, loss_init = gradient_descent_step(X, y, w_init, b_init, learning_rate=0.1)
    
    # Obliczmy nowy loss po kroku
    new_error = (X @ w_next + b_next) - y
    loss_after = 0.5 * np.mean(new_error ** 2)
    
    assert loss_after < loss_init, f"Krok gradient descent nie zmniejszyl bledu! Przed: {loss_init:.4f}, Po: {loss_after:.4f}. Sprawdz znak aktualizacji (odejmowanie gradientu)!"
    __record_test__("test_loss_reduction", "Zmniejszenie funkcji straty po kroku gradientu (znak minus)", True)
    
    # Test 2: Precyzyjna weryfikacja gradientu na prostym przykladzie (N=2, D=1)
    X_simple = np.array([[1.0], [2.0]])
    y_simple = np.array([2.0, 4.0])
    w_simple = np.array([0.0])
    b_simple = 0.0
    # y_hat = [0, 0], error = [-2, -4]
    # dw = (1*(-2) + 2*(-4)) / 2 = (-2 - 8)/2 = -5.0
    # db = (-2 + -4) / 2 = -3.0
    # w_new = 0 - (0.1 * -5.0) = +0.5
    # b_new = 0 - (0.1 * -3.0) = +0.3
    w_res, b_res, _ = gradient_descent_step(X_simple, y_simple, w_simple, b_simple, learning_rate=0.1)
    assert np.isclose(w_res[0], 0.5), f"Oczekiwano w_new = 0.5, otrzymano {w_res[0]}. Sprawdz dzielenie przez N i znak."
    assert np.isclose(b_res, 0.3), f"Oczekiwano b_new = 0.3, otrzymano {b_res}. Sprawdz dzielenie przez N i znak."
    __record_test__("test_analytical_gradient", "Analityczna dokladnosc obliczen gradientu (dw, db / N)", True)
    
    # Test 3: Stabilnosc ksztaltow wyjsciowych
    assert w_res.shape == w_simple.shape, f"Ksztalt wag sie zmienil! Oczekiwano {w_simple.shape}, otrzymano {w_res.shape}"
    __record_test__("test_weight_shape_preservation", "Zachowanie wymiarow wektora wag", True)
`,
    commonErrors: [
      {
        pattern: "nie zmniejszyl bledu",
        level1Hint: "Gdy stoisz na zboczu góry i chcesz zejść w dolinę (zminimalizować wysokość), czy idziesz w kierunku wskazywanym przez wektor nachylenia w górę, czy w przeciwnym?",
        level2Hint: "Gradient wskazuje kierunek najszybszego WZROSTU funkcji. Aby zminimalizować błąd (Gradient Descent), musimy odjąć gradient pomnożony przez współczynnik uczenia.",
        level3Hint: "Zmień `new_w = w + learning_rate * dw` na `new_w = w - learning_rate * dw` (oraz analogicznie dla `b`)."
      },
      {
        pattern: "Oczekiwano w_new = 0.5",
        level1Hint: "Jak definiujemy funkcję błędu średniokwadratowego (MSE)? Czy to suma błędów, czy średnia błędów?",
        level2Hint: "Sprawdź, czy podzieliłeś gradienty `dw` i `db` przez liczbę próbek `N`. Bez tego krok rośnie wraz z wielkością zbioru danych.",
        level3Hint: "Zastosuj `dw = (X.T @ error) / N` oraz `db = np.sum(error) / N`."
      }
    ]
  },
  {
    id: 'task-6',
    slug: 'sklearn-stratified-cv',
    title: 'Walidacja Krzyżowa StratifiedKFold i F1-Score',
    module: 'Moduł 2: Scikit-Learn & Optymalizacja ML',
    category: 'Scikit-Learn',
    difficulty: 'Zaawansowany',
    estimatedMinutes: 20,
    requiredSymbols: ['evaluate_imbalanced_cv'],
    summary: 'Zaimplementuj stratyfikowaną walidację krzyżową (StratifiedKFold) z potokiem Pipeline i metryką F1 dla niezbalansowanych danych.',
    descriptionMarkdown: `### 🎯 Cel Zadania
W rzeczywistych problemach (np. wykrywanie oszustw, diagnostyka medyczna) klasy są silnie **niezbalansowane** (np. 90% klasy 0 i tylko 10% klasy 1). Zwykłe \`KFold\` oraz metryka \`accuracy\` dają wtedy fałszywie optymistyczne wyniki.

W tym zadaniu poprawisz funkcję \`evaluate_imbalanced_cv(X, y, n_splits=5)\` w bibliotece \`scikit-learn\`.

### 🛠️ Wymagania Implementacyjne
1. **Stratyfikacja foldów:** Zamiast zwykłego \`KFold\` użyj \`StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)\`, aby każdy fold zachowywał proporcję klasy mniejszościowej.
2. **Bezpieczny Pipeline:** Zbuduj potok \`Pipeline\` ze skalowaniem \`StandardScaler()\` i klasyfikatorem \`LogisticRegression(class_weight='balanced', max_iter=500, random_state=42)\`.
3. **Właściwa metryka:** Ewaluuj potok za pomocą \`cross_val_score(..., scoring='f1')\` zamiast \`accuracy\`.

### ⚠️ Pułapki
- **Brak stratyfikacji:** W małych zbiorach niezbalansowanych zwykłe \`KFold\` może utworzyć fold bez ani jednej próbki klasy pozytywnej.
- **Pułapka Accuracy:** Model przewidujący zawsze \`0\` przy 90% klasy większościowej osiąga \`90% accuracy\`, ale jego **F1-score wynosi 0.0**!
`,
    starterCode: `import numpy as np
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

def evaluate_imbalanced_cv(X: np.ndarray, y: np.ndarray, n_splits: int = 5) -> dict:
    """
    Przeprowadza stratyfikowana walidacje krzyzowa dla niezbalansowanego zbioru danych.
    
    Zwraca slownik:
        {
            "mean_f1": float,
            "std_f1": float,
            "scores": np.ndarray,
            "cv": StratifiedKFold,
            "pipeline": Pipeline
        }
    """
    # Krok 1: Zdefiniuj obiekt walidacji krzyzowej
    # UWAGA: czy zwykly KFold zachowuje proporcje klas niezbalansowanych?
    cv = KFold(n_splits=n_splits, shuffle=True, random_state=42) # TODO: uzyj StratifiedKFold
    
    # Krok 2: Zbuduj bezpieczny Pipeline (skaler + regresja logistyczna z class_weight='balanced')
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=500, random_state=42)) # TODO: uwzglednij niezbalansowanie klas
    ])
    
    # Krok 3: Policz wyniki walidacji krzyzowej odpowiednia metryka dla klas niezbalansowanych
    scores = cross_val_score(pipeline, X, y, cv=cv, scoring="accuracy") # TODO: zmien metryke na F1
    
    return {
        "mean_f1": float(np.mean(scores)),
        "std_f1": float(np.std(scores)),
        "scores": scores,
        "cv": cv,
        "pipeline": pipeline
    }
`,
    referenceSolution: `import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

def evaluate_imbalanced_cv(X: np.ndarray, y: np.ndarray, n_splits: int = 5) -> dict:
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(class_weight="balanced", max_iter=500, random_state=42))
    ])
    
    scores = cross_val_score(pipeline, X, y, cv=cv, scoring="f1")
    
    return {
        "mean_f1": float(np.mean(scores)),
        "std_f1": float(np.std(scores)),
        "scores": scores,
        "cv": cv,
        "pipeline": pipeline
    }
`,
    testSuiteCode: `
def run_all_tests():
    import numpy as np
    from sklearn.datasets import make_classification
    from sklearn.model_selection import StratifiedKFold
    from sklearn.pipeline import Pipeline
    
    X, y = make_classification(
        n_samples=250,
        n_features=8,
        n_informative=5,
        weights=[0.88, 0.12],
        random_state=42
    )
    
    res = evaluate_imbalanced_cv(X, y, n_splits=5)
    
    # Test 1: Weryfikacja StratifiedKFold
    assert isinstance(res["cv"], StratifiedKFold), f"Oczekiwano StratifiedKFold dla niezbalansowanych klas, otrzymano {type(res['cv']).__name__}!"
    __record_test__("test_stratified_cv", "Uzycie StratifiedKFold zachowujacego proporcje klas", True)
    
    # Test 2: Weryfikacja potoku Pipeline i class_weight='balanced'
    pipe = res["pipeline"]
    assert isinstance(pipe, Pipeline), "Model musi byc opakowany w obiekt Pipeline!"
    clf = pipe.named_steps.get("classifier")
    assert clf is not None and getattr(clf, "class_weight", None) == "balanced", "Klasyfikator LogisticRegression powinien miec ustawione class_weight='balanced'!"
    __record_test__("test_pipeline_balanced", "Pipeline z StandardScaler i class_weight='balanced'", True)
    
    # Test 3: Weryfikacja czy metryka to F1 (nie accuracy)
    # Na tym zbiorze niezbalansowanym accuracy jest > 0.85, a balanced F1 jest istotnie nizsze (ok. 0.55 - 0.80)
    from sklearn.model_selection import cross_val_score
    expected_f1 = cross_val_score(pipe, X, y, cv=res["cv"], scoring="f1")
    assert np.allclose(res["scores"], expected_f1), f"Wyniki nie odpowiadaja metryce scoring='f1'! Otrzymano srednia {res['mean_f1']:.4f}, oczekiwano {np.mean(expected_f1):.4f}."
    assert len(res["scores"]) == 5, f"Oczekiwano 5 wynikow foldow, otrzymano {len(res['scores'])}"
    __record_test__("test_f1_scoring", "Poprawne uzycie metryki scoring='f1' w cross_val_score", True)
`,
    commonErrors: [
      {
        pattern: "StratifiedKFold",
        level1Hint: "Co może stać się w zwykłym KFold, gdy tylko 10% próbek należy do klasy pozytywnej? Czy każdy fold dostanie równą reprezentację tej klasy?",
        level2Hint: "Zastąp `KFold` klasą `StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)`.",
        level3Hint: "Stratyfikacja dzieli zbiór tak, aby stosunek klas 0/1 w każdym foldzie odpowiadał rozkładowi w całym zbiorze."
      },
      {
        pattern: "class_weight",
        level1Hint: "Gdy klasa 0 występuje 8 razy częściej niż klasa 1, na czym skupia się standardowa funkcja kosztu klasyfikatora?",
        level2Hint: "Przekaż `class_weight='balanced'` do `LogisticRegression(...)`, aby automatycznie zwiększyć wagę błędów na klasie mniejszościowej.",
        level3Hint: "Tryb `balanced` skaluje wagi odwrotnie proporcjonalnie do częstości występowania klas: $n_{samples} / (n_{classes} \\cdot np.bincount(y))$."
      },
      {
        pattern: "scoring='f1'",
        level1Hint: "Dlaczego na zbiorze z 90% klasy 0 metryka accuracy oszukuje (nawet stały model ma 90%)?",
        level2Hint: "W `cross_val_score(...)` zamień `scoring='accuracy'` na `scoring='f1'`.",
        level3Hint: "F1-score jest średnią harmoniczną precyzji (Precision) i czułości (Recall), dzięki czemu silnie karze ignorowanie klasy mniejszościowej."
      }
    ]
  }
];

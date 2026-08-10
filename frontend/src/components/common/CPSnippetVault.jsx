import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const SNIPPETS = [
  // ── C++ SNIPPETS ──
  {
    id: "fastio",
    title: "⚡ C++ Fast I/O Template",
    lang: "cpp",
    desc: "Accelerates std::cin & std::cout for competitive programming",
    code: `#include <bits/stdc++.h>
using namespace std;

void solve() {
    // Write code here
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t = 1;
    cin >> t;
    while(t--) solve();
    return 0;
}`,
  },
  {
    id: "modpow",
    title: "🔢 Modular Exponentiation (Binary Pow)",
    lang: "cpp",
    desc: "O(log N) modular exponentiation algorithm",
    code: `long long modpow(long long base, long long exp, long long mod = 1000000007) {
    long long res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 == 1) res = (res * base) % mod;
        base = (base * base) % mod;
        exp /= 2;
    }
    return res;
}`,
  },
  {
    id: "dsu",
    title: "🌐 Disjoint Set Union (DSU)",
    lang: "cpp",
    desc: "Disjoint set union with path compression & size ranking",
    code: `struct DSU {
    vector<int> parent, size;
    DSU(int n) {
        parent.resize(n + 1);
        iota(parent.begin(), parent.end(), 0);
        size.assign(n + 1, 1);
    }
    int find(int i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]);
    }
    bool unite(int i, int j) {
        int root_i = find(i), root_j = find(j);
        if (root_i != root_j) {
            if (size[root_i] < size[root_j]) swap(root_i, root_j);
            parent[root_j] = root_i;
            size[root_i] += size[root_j];
            return true;
        }
        return false;
    }
};`,
  },
  {
    id: "segtree",
    title: "🌲 Segment Tree",
    lang: "cpp",
    desc: "Point update & range query segment tree",
    code: `struct SegTree {
    int n;
    vector<long long> tree;
    SegTree(int n) : n(n), tree(4 * n, 0) {}
    void update(int node, int start, int end, int idx, long long val) {
        if (start == end) { tree[node] = val; return; }
        int mid = (start + end) / 2;
        if (start <= idx && idx <= mid) update(2 * node, start, mid, idx, val);
        else update(2 * node + 1, mid + 1, end, idx, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
    long long query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(2 * node, start, mid, l, r) + query(2 * node + 1, mid + 1, end, l, r);
    }
};`,
  },
  {
    id: "sieve",
    title: "🎯 Sieve of Eratosthenes",
    lang: "cpp",
    desc: "O(N log log N) prime numbers generator",
    code: `vector<bool> is_prime;
void sieve(int n) {
    is_prime.assign(n + 1, true);
    is_prime[0] = is_prime[1] = false;
    for (int p = 2; p * p <= n; p++) {
        if (is_prime[p]) {
            for (int i = p * p; i <= n; i += p) is_prime[i] = false;
        }
    }
}`,
  },

  // ── PYTHON SNIPPETS ──
  {
    id: "fastio_py",
    title: "⚡ Python Fast I/O & Recursion Setup",
    lang: "python",
    desc: "sys.stdin.read & sys.setrecursionlimit for fast CP in Python",
    code: `import sys
import math
sys.setrecursionlimit(200000)

def input():
    return sys.stdin.readline().rstrip()
`,
  },
  {
    id: "modpow_py",
    title: "🔢 Modular Exponentiation (Python)",
    lang: "python",
    desc: "Fast modular exponentiation using native pow(base, exp, mod)",
    code: `def modpow(base, exp, mod=10**9 + 7):
    return pow(base, exp, mod)
`,
  },
  {
    id: "dsu_py",
    title: "🌐 Disjoint Set Union (Python DSU)",
    lang: "python",
    desc: "DSU implementation in Python with path compression",
    code: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n + 1))
        self.size = [1] * (n + 1)

    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def unite(self, i, j):
        root_i, root_j = self.find(i), self.find(j)
        if root_i != root_j:
            if self.size[root_i] < self.size[root_j]:
                root_i, root_j = root_j, root_i
            self.parent[root_j] = root_i
            self.size[root_i] += self.size[root_j]
            return True
        return False
`,
  },
  {
    id: "heap_py",
    title: "📦 Min/Max Heap Operations (heapq)",
    lang: "python",
    desc: "Priority queue helper using Python heapq module",
    code: `import heapq

# Min Heap Example
min_heap = []
heapq.heappush(min_heap, 10)
val = heapq.heappop(min_heap)
`,
  },

  // ── JAVA SNIPPETS ──
  {
    id: "fastio_java",
    title: "⚡ Java Fast I/O Reader Template",
    lang: "java",
    desc: "BufferedReader & StringTokenizer for fast Java I/O",
    code: `import java.io.*;
import java.util.*;

public class Main {
    static class FastScanner {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer("");
        String next() {
            while (!st.hasMoreTokens()) {
                try { st = new StringTokenizer(br.readLine()); }
                catch (IOException e) { e.printStackTrace(); }
            }
            return st.nextToken();
        }
        int nextInt() { return Integer.parseInt(next()); }
        long nextLong() { return Long.parseLong(next()); }
    }

    public static void main(String[] args) {
        FastScanner sc = new FastScanner();
        PrintWriter out = new PrintWriter(System.out);
        // Write code here
        out.flush();
    }
}
`,
  },
  {
    id: "dsu_java",
    title: "🌐 Disjoint Set Union (Java DSU)",
    lang: "java",
    desc: "DSU class for Java competitive programming",
    code: `static class DSU {
    int[] parent, size;
    DSU(int n) {
        parent = new int[n + 1];
        size = new int[n + 1];
        for (int i = 0; i <= n; i++) { parent[i] = i; size[i] = 1; }
    }
    int find(int i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]);
    }
    boolean unite(int i, int j) {
        int rootI = find(i), rootJ = find(j);
        if (rootI != rootJ) {
            if (size[rootI] < size[rootJ]) { int t = rootI; rootI = rootJ; rootJ = t; }
            parent[rootJ] = rootI;
            size[rootI] += size[rootJ];
            return true;
        }
        return false;
    }
}
`,
  },

  // ── JAVASCRIPT / NODE.JS SNIPPETS ──
  {
    id: "fastio_js",
    title: "⚡ Node.js Fast I/O Template",
    lang: "javascript",
    desc: "fs.readFileSync fast I/O for JavaScript in CP",
    code: `const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    let ptr = 0;
    const next = () => input[ptr++];
    
    // Write code here
}

main();
`,
  },
  {
    id: "modpow_js",
    title: "🔢 Modular Exponentiation (BigInt JS)",
    lang: "javascript",
    desc: "Safe BigInt modular exponentiation in JavaScript",
    code: `function modpow(base, exp, mod = 1000000007n) {
    let res = 1n;
    base = BigInt(base) % BigInt(mod);
    exp = BigInt(exp);
    while (exp > 0n) {
        if (exp % 2n === 1n) res = (res * base) % BigInt(mod);
        base = (base * base) % BigInt(mod);
        exp /= 2n;
    }
    return res;
}
`,
  },
  {
    id: "dsu_js",
    title: "🌐 Disjoint Set Union (JavaScript DSU)",
    lang: "javascript",
    desc: "DSU implementation in JavaScript",
    code: `class DSU {
    constructor(n) {
        this.parent = Array.from({ length: n + 1 }, (_, i) => i);
        this.size = new Array(n + 1).fill(1);
    }
    find(i) {
        if (this.parent[i] === i) return i;
        return (this.parent[i] = this.find(this.parent[i]));
    }
    unite(i, j) {
        let rootI = this.find(i), rootJ = this.find(j);
        if (rootI !== rootJ) {
            if (this.size[rootI] < this.size[rootJ]) [rootI, rootJ] = [rootJ, rootI];
            this.parent[rootJ] = rootI;
            this.size[rootI] += this.size[rootJ];
            return true;
        }
        return false;
    }
}
`,
  },
];

export default function CPSnippetVault({ onInsertSnippet, activeLanguage = "cpp" }) {
  const [open, setOpen] = useState(false);
  const [filterLang, setFilterLang] = useState("all");

  const filteredSnippets = SNIPPETS.filter((s) => {
    if (filterLang === "all") return true;
    return s.lang === filterLang;
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-mono text-xs font-bold bg-purple-600/20 hover:bg-purple-600 border border-purple-400/50 text-purple-300 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
      >
        <span>📦</span> CP SNIPPET VAULT
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e0e17] border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-purple-950/20">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <h3 className="font-mono font-extrabold text-sm text-purple-300 tracking-wider">
                    CP ALGORITHM SNIPPET VAULT
                  </h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-text-muted hover:text-white font-mono text-xs px-2 py-1 rounded bg-bg-elevated"
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Language Selector Filter Tabs */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-black/40 border-b border-border/60 overflow-x-auto custom-scrollbar">
                {[
                  { id: "all", label: "ALL LANGUAGES" },
                  { id: "cpp", label: "C++ (g++)" },
                  { id: "python", label: "PYTHON 3" },
                  { id: "java", label: "JAVA" },
                  { id: "javascript", label: "JAVASCRIPT" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterLang(tab.id)}
                    className={`font-mono text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                      filterLang === tab.id
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-purple-950/30 text-purple-300 hover:bg-purple-900/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Snippets List */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                {filteredSnippets.map((snip) => {
                  const isCurrentLang = activeLanguage.startsWith(snip.lang) || (snip.lang === "cpp" && activeLanguage.includes("c"));

                  return (
                    <div
                      key={snip.id}
                      className={`bg-black/50 border rounded-xl p-4 transition-all ${
                        isCurrentLang ? "border-purple-500/60 bg-purple-950/10" : "border-border/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono text-sm font-bold text-white">{snip.title}</h4>
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                            {snip.lang}
                          </span>
                          {isCurrentLang && (
                            <span className="font-mono text-[9px] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded">
                              ⚡ MATCHES EDITOR
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            onInsertSnippet(snip);
                            setOpen(false);
                          }}
                          className="font-mono text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md"
                        >
                          ↙ INSERT AT CURSOR
                        </button>
                      </div>

                      <p className="text-text-muted text-xs mb-3">{snip.desc}</p>

                      <pre className="font-mono text-xs bg-[#07070b] p-3 rounded-lg border border-border/50 text-purple-200 overflow-x-auto custom-scrollbar max-h-36">
                        <code>{snip.code}</code>
                      </pre>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

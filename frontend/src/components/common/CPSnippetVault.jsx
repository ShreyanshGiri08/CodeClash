import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SNIPPETS = [
  {
    id: "fastio",
    title: "⚡ Fast I/O Template",
    lang: "cpp",
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
    title: "🌲 Segment Tree (Point Update, Range Query)",
    lang: "cpp",
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
];

export default function CPSnippetVault({ onInsertSnippet }) {
  const [open, setOpen] = useState(false);

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
              className="w-full max-w-2xl bg-[#121218] border border-purple-500/40 rounded-2xl p-6 space-y-5 shadow-[0_0_50px_rgba(168,85,247,0.3)] max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="font-extrabold text-base text-text-primary font-mono tracking-wide">
                    CP ALGORITHM SNIPPET VAULT
                  </h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="font-mono text-xs text-text-dim hover:text-text-primary cursor-pointer px-2 py-1 bg-black/50 border border-border rounded"
                >
                  ✕ CLOSE
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                {SNIPPETS.map((snip) => (
                  <div key={snip.id} className="bg-black/60 border border-border/80 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="font-mono text-xs font-extrabold text-accent">{snip.title}</p>
                      <button
                        onClick={() => {
                          if (onInsertSnippet) onInsertSnippet(snip);
                          setOpen(false);
                        }}

                        className="font-mono text-[11px] font-black bg-accent text-black px-3 py-1.5 rounded-lg hover:shadow-[0_0_15px_rgba(255,230,12,0.4)] hover:scale-105 transition-all cursor-pointer"
                      >
                        ↙ INSERT INTO MONACO IDE
                      </button>
                    </div>
                    <pre className="font-mono text-[11px] bg-[#09090e] p-3 rounded-lg text-text-muted overflow-x-auto custom-scrollbar border border-white/5">
                      {snip.code}
                    </pre>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

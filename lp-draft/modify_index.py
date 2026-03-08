import re
import os

filepath = r'c:\Users\nexus\Desktop\anti-gravity-project\lp-draft\index.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update FV text
new_fv_msg = """<div class="hero-message">
                <p>「AI時代に、なぜ人から学ぶのか？」</p>
                <p>
                    <span style="display: inline-block;">AIは効率化できても、あなたの英語力そのものは変えてくれません。</span>
                </p>
                <p>
                    <span style="display: inline-block;">学習を変え、確かな結果を出すのは、</span><br><span style="display: inline-block;">一人ひとりに伴走する「人」の存在です。</span>
                </p>
                <p>
                    <span style="display: inline-block;">採用率0.3%のプロフェッショナルが、</span><br><span style="display: inline-block;">あなたの学習を最大化します。</span>
                </p>
            </div>"""
content = re.sub(r'<div class="hero-message">.*?</div>', new_fv_msg, content, flags=re.DOTALL)

# 2. Update Daily Coaching text
old_text = r'毎日の学習報告から細かな疑問まで、専属コーチが<br class="sp-only">チャットで丁寧にサポートします。<br>モチベーションを維持し、挫折させません。'
new_text = r'毎日の学習報告から細かな疑問まで、専属コーチが<br class="sp-only">チャットで丁寧にサポートします。<br>日々の学習進捗を管理し、モチベーションの波に寄り添いながら、挫折しそうな時こそ強力に伴走します。'
content = content.replace(old_text, new_text)

# 3. Add placeholder comment for image
new_chat_1 = """                <!-- 【画像差し替えプレースホルダー】 -->
                <!-- 後日、実際のLINE添削スクショ画像（例：real-line-chat.png）に差し替える場合は、以下の <div class="chat-phone">...</div> を削除し、 -->
                <!-- <img src="real-line-chat.png" alt="LINE添削スクショ" style="width:100%; max-width:340px; border-radius: 30px;"> のように配置してください -->
                <div class="chat-phone">"""
sec_line_match = re.search(r'(<section id="sec-line">.*?</section>)', content, flags=re.DOTALL)
if sec_line_match:
    sec_line_content = sec_line_match.group(1)
    sec_line_content = sec_line_content.replace('<div class="chat-phone">', new_chat_1)
    content = content.replace(sec_line_match.group(1), sec_line_content)

# 4. Extract sections and reorder
sections = {}
patterns = {
    'voice': r'<!-- 劇的な変化 -->\s*(<section id="sec-voice">.*?</section>)',
    'line': r'<!-- LINEサポート -->\s*(<section id="sec-line">.*?</section>)',
    'video': r'<!-- 動画 -->\s*(<section id="sec-video">.*?</section>)',
    'coach': r'<!-- コーチ紹介 -->\s*(<section id="sec-coach">.*?</section>)',
    'compare': r'<!-- なぜイングリードが選ばれるのか（他社比較） -->\s*(<section id="sec-compare">.*?</section>)',
    'schedule': r'<!-- 受講生の1日（学習スケジュール） -->\s*(<section id="sec-schedule">.*?</section>)',
    'features': r'<!-- 特徴 -->\s*(<section>\s*<div class="container">\s*<h2 class="section-title">イングリードの特徴</h2>.*?</section>)',
    'cta': r'<!-- CTA -->\s*(<section id="sec-cta">.*?</section>)',
    'faq': r'<!-- FAQ -->\s*(<section id="sec-faq">.*?</section>)'
}

for name, pat in patterns.items():
    match = re.search(pat, content, flags=re.DOTALL)
    if match:
        sections[name] = match.group(0)
        content = content.replace(match.group(0), f"[[[PLACEHOLDER_{name}]]]")

new_order_str = f"""
{sections['features']}

<!-- 実際のサービス内容（受講生の1日〜音声Before/After） -->
{sections['schedule']}

{sections['line']}

{sections['video']}

{sections['voice']}

{sections['compare']}

{sections['coach']}

    <!-- 【新規追加】コンサルタント紹介セクション -->
    <section id="consultant-intro">
        <!-- コンサルタント紹介枠 -->
    </section>

{sections['faq']}

{sections['cta']}
"""

placeholder_pattern = r'(?:\[\[\[PLACEHOLDER_[a-z]+\]\]\]\s*)+'
content = re.sub(placeholder_pattern, new_order_str, content)

# 5. Reorder TOC
old_toc_re = r'<ul class="toc-list">.*?</ul>'
new_toc = """<ul class="toc-list">
            <li><a href="#sec-schedule">受講生の1日</a></li>
            <li><a href="#sec-line">毎日のLINEサポート</a></li>
            <li><a href="#sec-video">カウンセリング映像</a></li>
            <li><a href="#sec-voice">実際の音声 (Before/After)</a></li>
            <li><a href="#sec-compare">他社比較表</a></li>
            <li><a href="#sec-coach">コーチ紹介</a></li>
            <li><a href="#sec-faq">よくあるご質問</a></li>
        </ul>"""
content = re.sub(old_toc_re, new_toc, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
